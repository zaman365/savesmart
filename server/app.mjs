import {initializeReverse,createReverseHandler} from './reverse.mjs';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {categories} from '../data/catalogue.mjs';
import {openDatabase,seedDemo,id,now,transaction,audit,offerJSON,publicOfferSQL} from './db.mjs';
import {HttpError,fail,text,amount,category,safeUrl,futureDate,compareOffers,searchCategory,ownershipCost} from './domain.mjs';
import {hashPassword,verifyPassword,sessionUser,startSession,endSession,requireUser,requireAdmin} from './auth.mjs';

const webRoot=resolve(fileURLToPath(new URL('../apps/web/',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'};
const publicUser=u=>u?{id:u.id,name:u.name,email:u.email,role:u.role}:null;

export async function createApp({databasePath=':memory:',demoMode=false,production=false,appOrigin='',log=console}={}) {
  if(production&&demoMode)throw new Error('Demo mode cannot run in production.');
  if(production&&!appOrigin.startsWith('https://'))throw new Error('Production requires an explicit HTTPS APP_ORIGIN.');
  const db=openDatabase(databasePath);
  initializeReverse(db);
  if(demoMode)await seedDemo(db,hashPassword);
  if(!demoMode&&db.prepare('SELECT id FROM offers WHERE is_sample=1 LIMIT 1').get()){db.close();throw new Error('A demo database cannot be used in live mode. Choose a clean DATABASE_PATH.');}
  const limits=new Map();
  function rate(req,bucket,maximum=90){const key=`${req.socket.remoteAddress}:${bucket}`,time=Date.now(),entry=limits.get(key);if(!entry||time-entry.time>600000){if(limits.size>10000)limits.clear();limits.set(key,{time,count:1});return;}if(++entry.count>maximum)fail(429,'Too many attempts. Please try again later.');}
  const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
  async function body(req){if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'Send application/json.');let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>65536)fail(413,'This request is too large.');}try{const parsed=JSON.parse(raw);if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')fail(400,'Send a JSON object.');return parsed;}catch(e){if(e instanceof HttpError)throw e;fail(400,'The request contains invalid JSON.');}}
  const reverseHandler=createReverseHandler({db,body,json,rate});
  function approvedOffer(oid){const o=db.prepare(publicOfferSQL+' AND o.id=?').get(now(),oid);if(!o)fail(404,'This offer is unavailable or awaiting review.');return offerJSON(o);}
  function ownBusiness(bid,user){requireUser(user);const b=db.prepare('SELECT * FROM businesses WHERE id=? AND owner_id=?').get(bid,user.id);if(!b)fail(404,'Business not found.');return b;}
  function ownRequest(rid,user){requireUser(user);const r=db.prepare('SELECT * FROM requests WHERE id=? AND user_id=?').get(rid,user.id);if(!r)fail(404,'Request not found.');return r;}
  function planOwned(pid,user){requireUser(user);const p=db.prepare('SELECT * FROM plans WHERE id=? AND user_id=?').get(pid,user.id);if(!p)fail(404,'Plan not found.');return p;}
  function visibleDeals(user){return db.prepare(`SELECT d.*,u.name author,(SELECT COUNT(*) FROM votes v WHERE v.deal_id=d.id) votes,(SELECT COUNT(*) FROM comments c WHERE c.deal_id=d.id) comments,(SELECT COUNT(*) FROM votes v WHERE v.deal_id=d.id AND v.user_id=?) voted FROM deals d JOIN users u ON u.id=d.user_id WHERE d.status='approved' AND d.expires_at>? ORDER BY votes DESC,d.created_at DESC`).all(user?.id??'',now()).map(d=>({...d,is_sample:Boolean(d.is_sample),voted:Boolean(d.voted)}));}
  async function api(req,res,url,user){const p=url.pathname,m=req.method;let match;
    if(await reverseHandler({req,res,url,user}))return;
    if(m==='GET'&&p==='/api/health')return json(res,200,{ok:true});
    if(m==='GET'&&p==='/api/bootstrap')return json(res,200,{categories,user:publicUser(user),demoMode,demo:demoMode?{password:'DemoCompare24!',accounts:{buyer:'buyer@demo.savesmart.test',merchant:'merchant@demo.savesmart.test',admin:'admin@demo.savesmart.test'}}:null});
    if(m==='POST'&&p==='/api/auth/register'){
      rate(req,'auth',15);const b=await body(req),name=text(b.name,'Name',2,80),email=text(b.email,'Email',5,160).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'Enter a valid email address.');
      if(db.prepare('SELECT id FROM users WHERE email=?').get(email))fail(409,'This email address is already registered.');const password=await hashPassword(b.password),uid=id('user');
      transaction(db,()=>{db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(uid,name,email,password,'consumer',now());db.prepare('INSERT INTO plans VALUES(?,?,?,?,?)').run(id('plan'),uid,'Saved for later','general',now());});startSession(db,uid,res,production);return json(res,201,{user:{id:uid,name,email,role:'consumer'}});
    }
    if(m==='POST'&&p==='/api/auth/login'){
      rate(req,'auth',15);const b=await body(req),email=text(b.email,'Email',5,160).toLowerCase(),u=db.prepare('SELECT * FROM users WHERE email=?').get(email);
      const dummy='e51d8258b2e43f401e05d94130312d28:'+ '0'.repeat(128);const valid=await verifyPassword(b.password,u?.password_hash??dummy);if(!u||!valid)fail(401,'Email or password is incorrect.');startSession(db,u.id,res,production);return json(res,200,{user:publicUser(u)});
    }
    if(m==='POST'&&p==='/api/auth/logout'){endSession(db,req,res,production);return json(res,200,{ok:true});}
    if(m==='GET'&&p==='/api/offers'){
      const q=(url.searchParams.get('q')??'').trim().toLowerCase().slice(0,120),cat=url.searchParams.get('category')||searchCategory(q),loc=url.searchParams.get('location'),max=url.searchParams.get('max'),payment=url.searchParams.get('payment');
      let all=db.prepare(publicOfferSQL+' ORDER BY o.price+o.fees,o.id').all(now()).map(offerJSON);
      if(cat)all=all.filter(o=>o.category===cat);if(q&&!searchCategory(q))all=all.filter(o=>`${o.title} ${o.merchant} ${o.location} ${Object.values(o.attributes).join(' ')}`.toLowerCase().includes(q));
      if(loc)all=all.filter(o=>o.location.toLowerCase().includes(loc.toLowerCase())||o.location==='Bangladesh');if(max!==null&&max!=='')all=all.filter(o=>o.total<=amount(max,'Maximum price'));
      if(payment)all=all.filter(o=>o.payment===payment||o.payment==='Any');if(url.searchParams.get('sort')==='price-desc')all.reverse();
      return json(res,200,{offers:all.slice(0,100),total:all.length});
    }
    if(m==='GET'&&p==='/api/compare'){const ids=(url.searchParams.get('ids')??'').split(',').filter(Boolean);if(new Set(ids).size!==ids.length)fail(400,'Select different offers.');return json(res,200,{offers:compareOffers(ids.map(approvedOffer))});}
    if(m==='GET'&&(match=p.match(/^\/api\/offers\/([^/]+)$/))){const o=approvedOffer(match[1]);return json(res,200,{offer:o,history:db.prepare('SELECT total,recorded_at FROM price_history WHERE offer_id=? ORDER BY recorded_at DESC LIMIT 30').all(o.id)});}
    if(m==='GET'&&(match=p.match(/^\/api\/businesses\/([^/]+)$/))){const b=db.prepare("SELECT id,name,category,location,description,response_hours,is_sample FROM businesses WHERE id=? AND status='approved'").get(match[1]);if(!b)fail(404,'Business not found.');return json(res,200,{business:b,offers:db.prepare(publicOfferSQL+' AND o.business_id=?').all(now(),b.id).map(offerJSON)});}
    if(m==='GET'&&p==='/api/plans'){
      requireUser(user);const plans=db.prepare('SELECT * FROM plans WHERE user_id=? ORDER BY created_at DESC').all(user.id).map(pl=>({...pl,items:db.prepare("SELECT o.*,b.name merchant FROM plan_items i JOIN offers o ON o.id=i.offer_id JOIN businesses b ON b.id=o.business_id WHERE i.plan_id=? AND o.status='approved' AND b.status='approved'").all(pl.id).map(offerJSON)}));
      const alerts=db.prepare("SELECT a.*,o.title,o.price+o.fees current_price FROM alerts a JOIN offers o ON o.id=a.offer_id JOIN businesses b ON b.id=o.business_id WHERE a.user_id=? AND o.status='approved' AND b.status='approved' AND o.expires_at>?").all(user.id,now()).map(a=>({...a,reached:a.current_price<=a.target_price}));return json(res,200,{plans,alerts});
    }
    if(m==='POST'&&p==='/api/plans'){requireUser(user);const b=await body(req),pid=id('plan');db.prepare('INSERT INTO plans VALUES(?,?,?,?,?)').run(pid,user.id,text(b.title,'Plan title',2,100),text(b.kind??'general','Plan type',2,30),now());return json(res,201,{id:pid});}
    if(m==='POST'&&(match=p.match(/^\/api\/plans\/([^/]+)\/items$/))){planOwned(match[1],user);const b=await body(req),offer=approvedOffer(b.offerId);db.prepare('INSERT OR IGNORE INTO plan_items VALUES(?,?,?)').run(match[1],offer.id,now());return json(res,201,{ok:true});}
    if(m==='DELETE'&&(match=p.match(/^\/api\/plans\/([^/]+)\/items\/([^/]+)$/))){planOwned(match[1],user);db.prepare('DELETE FROM plan_items WHERE plan_id=? AND offer_id=?').run(match[1],match[2]);return json(res,200,{ok:true});}
    if(m==='DELETE'&&(match=p.match(/^\/api\/plans\/([^/]+)$/))){planOwned(match[1],user);db.prepare('DELETE FROM plans WHERE id=?').run(match[1]);return json(res,200,{ok:true});}
    if(m==='POST'&&p==='/api/alerts'){requireUser(user);const b=await body(req),o=approvedOffer(b.offerId),target=amount(b.targetPrice,'Target price');db.prepare('INSERT INTO alerts VALUES(?,?,?,?,?) ON CONFLICT(user_id,offer_id) DO UPDATE SET target_price=excluded.target_price').run(id('alert'),user.id,o.id,target,now());return json(res,201,{ok:true});}
    if(m==='DELETE'&&(match=p.match(/^\/api\/alerts\/([^/]+)$/))){requireUser(user);db.prepare('DELETE FROM alerts WHERE id=? AND user_id=?').run(match[1],user.id);return json(res,200,{ok:true});}
    if(m==='POST'&&p==='/api/requests'){
      requireUser(user);rate(req,'requests',30);const b=await body(req);if(b.contactConsent!==true)fail(400,'Consent to share contact with your selected provider is required.');const cat=category(b.category),title=text(b.title,'Request title',5,140),details=text(b.details,'Details',15,3000),location=text(b.location,'Location',2,100),budget=amount(b.budget,'Budget',1),rid=id('request');
      let providers=db.prepare("SELECT id FROM businesses WHERE category=? AND status='approved' AND owner_id<>? AND (LOWER(location)=LOWER(?) OR location='Bangladesh') ORDER BY response_hours,id LIMIT 3").all(cat,user.id,location);
      if(b.providerId){const selected=db.prepare("SELECT id FROM businesses WHERE id=? AND category=? AND status='approved' AND owner_id<>? AND (LOWER(location)=LOWER(?) OR location='Bangladesh')").get(b.providerId,cat,user.id,location);if(!selected)fail(400,'This provider does not serve the chosen request.');providers=[selected];}
      transaction(db,()=>{db.prepare('INSERT INTO requests VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(rid,user.id,cat,title,details,location,budget,1,providers.length?'open':'unmatched',null,now());for(const provider of providers)db.prepare('INSERT INTO assignments VALUES(?,?)').run(rid,provider.id);audit(db,user,'request.created',rid,`${providers.length} providers`);});return json(res,201,{id:rid,status:providers.length?'open':'unmatched',providerCount:providers.length});
    }
    if(m==='GET'&&p==='/api/requests'){
      requireUser(user);const requests=db.prepare('SELECT * FROM requests WHERE user_id=? ORDER BY created_at DESC').all(user.id).map(r=>({...r,providerCount:db.prepare('SELECT COUNT(*) n FROM assignments WHERE request_id=?').get(r.id).n,quotes:db.prepare('SELECT q.*,b.name merchant FROM quotes q JOIN businesses b ON b.id=q.business_id WHERE q.request_id=? ORDER BY q.amount').all(r.id)}));return json(res,200,{requests});
    }
    if(m==='POST'&&(match=p.match(/^\/api\/requests\/([^/]+)\/cancel$/))){const r=ownRequest(match[1],user);if(!['open','unmatched'].includes(r.status))fail(409,'This request cannot be cancelled in its current state.');db.prepare("UPDATE requests SET status='cancelled' WHERE id=?").run(r.id);return json(res,200,{ok:true});}
    if(m==='POST'&&(match=p.match(/^\/api\/requests\/([^/]+)\/select$/))){const r=ownRequest(match[1],user),b=await body(req);if(r.status!=='open')fail(409,'This request is already closed or selected.');const q=db.prepare("SELECT * FROM quotes WHERE id=? AND request_id=? AND status='offered' AND expires_at>?").get(b.quoteId,r.id,now());if(!q)fail(404,'This quote is unavailable or expired.');
      transaction(db,()=>{db.prepare("UPDATE requests SET selected_quote_id=?,status='selected' WHERE id=?").run(q.id,r.id);db.prepare("UPDATE quotes SET status=CASE WHEN id=? THEN 'accepted' ELSE 'declined' END WHERE request_id=?").run(q.id,r.id);audit(db,user,'quote.selected',q.id,'Buyer contact released only to selected business');});return json(res,200,{ok:true});
    }
    if(m==='POST'&&p==='/api/businesses'){
      requireUser(user);const b=await body(req),bid=id('business');db.prepare('INSERT INTO businesses VALUES(?,?,?,?,?,?,?,?,?,?)').run(bid,user.id,text(b.name,'Business name',3,120),category(b.category),text(b.location,'Service location',2,100),text(b.description,'Business description',20,1500),'pending',24,0,now());audit(db,user,'business.submitted',bid);return json(res,201,{id:bid,status:'pending'});
    }
    if(m==='GET'&&p==='/api/merchant'){
      requireUser(user);const businesses=db.prepare('SELECT * FROM businesses WHERE owner_id=? ORDER BY created_at').all(user.id),offers=db.prepare('SELECT o.*,b.name merchant FROM offers o JOIN businesses b ON b.id=o.business_id WHERE b.owner_id=? ORDER BY o.confirmed_at DESC').all(user.id).map(offerJSON);
      const inbox=db.prepare('SELECT r.*,a.business_id,b.name business_name FROM assignments a JOIN requests r ON r.id=a.request_id JOIN businesses b ON b.id=a.business_id WHERE b.owner_id=? ORDER BY r.created_at DESC').all(user.id).map(r=>{const q=db.prepare('SELECT * FROM quotes WHERE request_id=? AND business_id=?').get(r.id,r.business_id);const contact=r.selected_quote_id&&q?.id===r.selected_quote_id?db.prepare('SELECT name,email FROM users WHERE id=?').get(r.user_id):null;const {user_id,contact_consent,...safe}=r;return {...safe,quote:q??null,buyerContact:contact};});return json(res,200,{businesses,offers,inbox});
    }
    if(m==='POST'&&p==='/api/merchant/offers'){
      requireUser(user);const b=await body(req),business=ownBusiness(b.businessId,user);if(business.status!=='approved')fail(409,'Your business must be approved before publishing offers.');const oid=id('offer'),title=text(b.title,'Offer title',5,140),group=text(b.comparisonGroup,'Comparison group',3,100);if(!/^[a-z0-9-]+$/.test(group))fail(400,'Use lowercase letters, numbers and hyphens for the comparison group.');
      const attributes={Scope:text(b.scope,'Included scope',10,1500),Exclusions:text(b.exclusions??'None specified','Exclusions',2,1000)};
      db.prepare('INSERT INTO offers VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(oid,business.id,business.category,title,group,text(b.unit,'Price unit',2,80),business.location,amount(b.price,'Price'),amount(b.fees??0,'Mandatory fees'),amount(b.rebate??0,'Conditional rebate'),text(b.payment??'Any','Payment method',2,40),JSON.stringify(attributes),['travel','automotive'].includes(business.category)?(business.category==='travel'?'coast':'car'):'home','pending',0,now(),futureDate(b.expiresAt));audit(db,user,'offer.submitted',oid);return json(res,201,{id:oid,status:'pending'});
    }
    if(m==='PUT'&&(match=p.match(/^\/api\/merchant\/offers\/([^/]+)$/))){requireUser(user);const o=db.prepare('SELECT * FROM offers WHERE id=?').get(match[1]);if(!o)fail(404,'Offer not found.');ownBusiness(o.business_id,user);const b=await body(req),price=amount(b.price,'Price'),fees=amount(b.fees,'Mandatory fees');db.prepare("UPDATE offers SET price=?,fees=?,status='pending',confirmed_at=? WHERE id=?").run(price,fees,now(),o.id);audit(db,user,'offer.updated',o.id,'Price update awaits review');return json(res,200,{ok:true,status:'pending'});}
    if(m==='POST'&&(match=p.match(/^\/api\/merchant\/requests\/([^/]+)\/quotes$/))){
      requireUser(user);const b=await body(req),business=ownBusiness(b.businessId,user);if(business.status!=='approved')fail(403,'An approved business is required.');const r=db.prepare('SELECT r.* FROM requests r JOIN assignments a ON a.request_id=r.id WHERE r.id=? AND a.business_id=?').get(match[1],business.id);if(!r)fail(404,'Assigned request not found.');if(r.status!=='open')fail(409,'This request is no longer open.');const qid=id('quote');db.prepare('INSERT INTO quotes VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(request_id,business_id) DO UPDATE SET amount=excluded.amount,inclusions=excluded.inclusions,terms=excluded.terms,expires_at=excluded.expires_at').run(qid,r.id,business.id,amount(b.amount,'Total quote price',1),text(b.inclusions,'Inclusions',10,2000),text(b.terms,'Terms and exclusions',10,2000),futureDate(b.expiresAt),'offered',now());return json(res,201,{ok:true});
    }
    if(m==='GET'&&p==='/api/deals')return json(res,200,{deals:visibleDeals(user)});
    if(m==='POST'&&p==='/api/deals'){requireUser(user);rate(req,'deals',30);const b=await body(req),did=id('deal');db.prepare('INSERT INTO deals VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(did,user.id,text(b.title,'Deal title',5,140),category(b.category),amount(b.price,'Price'),text(b.terms,'Offer terms',20,3000),safeUrl(b.url),'pending',0,futureDate(b.expiresAt),now());audit(db,user,'deal.submitted',did);return json(res,201,{id:did,status:'pending'});}
    if(m==='POST'&&(match=p.match(/^\/api\/deals\/([^/]+)\/vote$/))){requireUser(user);const d=db.prepare("SELECT id FROM deals WHERE id=? AND status='approved' AND expires_at>?").get(match[1],now());if(!d)fail(404,'Deal not found.');const existing=db.prepare('SELECT user_id FROM votes WHERE deal_id=? AND user_id=?').get(d.id,user.id);if(existing)db.prepare('DELETE FROM votes WHERE deal_id=? AND user_id=?').run(d.id,user.id);else db.prepare('INSERT INTO votes VALUES(?,?)').run(d.id,user.id);return json(res,200,{voted:!existing,votes:db.prepare('SELECT COUNT(*) n FROM votes WHERE deal_id=?').get(d.id).n});}
    if(m==='GET'&&(match=p.match(/^\/api\/deals\/([^/]+)\/comments$/))){const d=db.prepare("SELECT id FROM deals WHERE id=? AND status='approved'").get(match[1]);if(!d)fail(404,'Deal not found.');return json(res,200,{comments:db.prepare('SELECT c.id,c.body,c.created_at,u.name author FROM comments c JOIN users u ON u.id=c.user_id WHERE c.deal_id=? ORDER BY c.created_at LIMIT 100').all(d.id)});}
    if(m==='POST'&&(match=p.match(/^\/api\/deals\/([^/]+)\/comments$/))){requireUser(user);rate(req,'comments',60);const d=db.prepare("SELECT id FROM deals WHERE id=? AND status='approved' AND expires_at>?").get(match[1],now());if(!d)fail(404,'Deal not found.');const b=await body(req);db.prepare('INSERT INTO comments VALUES(?,?,?,?,?)').run(id('comment'),d.id,user.id,text(b.body,'Comment',2,1000),now());return json(res,201,{ok:true});}
    if(m==='GET'&&p==='/api/admin'){requireAdmin(user);return json(res,200,{businesses:db.prepare("SELECT id,name,category,location,description,status FROM businesses WHERE status='pending' ORDER BY created_at").all(),offers:db.prepare("SELECT o.*,b.name merchant FROM offers o JOIN businesses b ON b.id=o.business_id WHERE o.status='pending' ORDER BY o.confirmed_at").all().map(offerJSON),deals:db.prepare("SELECT id,title,category,price,terms,url,expires_at,user_id FROM deals WHERE status='pending' ORDER BY created_at").all().map(d=>({...d,review:db.prepare("SELECT m.*,EXISTS(SELECT 1 FROM businesses b WHERE b.owner_id=?) owns_business FROM reverse_community_meta m WHERE m.deal_id=?").get(d.user_id,d.id)??null})),audit:db.prepare('SELECT action,entity_id,detail,created_at FROM audit ORDER BY created_at DESC LIMIT 40').all()});}
    if(m==='POST'&&p==='/api/admin/review'){requireAdmin(user);const b=await body(req),tables={business:'businesses',offer:'offers',deal:'deals'},table=tables[b.kind];if(!table)fail(400,'Choose a review type.');if(!['approved','rejected'].includes(b.decision))fail(400,'Choose an approval or rejection.');const record=db.prepare(`SELECT * FROM ${table} WHERE id=? AND status='pending'`).get(b.id);if(!record)fail(404,'Pending item not found.');const reason=text(b.reason,'Review reason',5,1000);if(table==='offers'&&b.decision==='approved'){const business=db.prepare('SELECT status FROM businesses WHERE id=?').get(record.business_id);if(business?.status!=='approved')fail(409,'Approve the business first.');if(record.expires_at<=now())fail(409,'This offer has expired.');}
      if(table==='deals'&&b.decision==='approved'&&record.expires_at<=now())fail(409,'This deal has expired.');transaction(db,()=>{db.prepare(`UPDATE ${table} SET status=? WHERE id=?`).run(b.decision,b.id);if(table==='offers'&&b.decision==='approved')db.prepare('INSERT INTO price_history VALUES(?,?,?,?)').run(id('price'),b.id,record.price+record.fees,now());audit(db,user,`${b.kind}.${b.decision}`,b.id,reason);});return json(res,200,{ok:true});}
    if(m==='POST'&&p==='/api/tools/ownership-cost')return json(res,200,ownershipCost(await body(req)));
    fail(404,'This endpoint does not exist.');
  }
  const server=createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    try {
      const requestOrigin=`http${production?'s':''}://${req.headers.host}`,origin=appOrigin||requestOrigin;
      if(demoMode&&!['127.0.0.1','localhost','[::1]'].includes(new URL(requestOrigin).hostname))fail(400,'The demonstration accepts loopback hosts only.');
      if(appOrigin&&new URL(appOrigin).host!==req.headers.host)fail(400,'Unexpected host.');
      const url=new URL(req.url,origin);
      if(url.pathname.startsWith('/api/')){
        if(!['GET','HEAD','POST','PUT','DELETE'].includes(req.method))fail(405,'Method not allowed.');
        if(!['GET','HEAD'].includes(req.method)){if(req.headers.origin!==origin)fail(403,'Only same-origin requests are accepted.');rate(req,'writes');}
        await api(req,res,url,sessionUser(db,req));return;
      }
      if(!['GET','HEAD'].includes(req.method))fail(405,'Method not allowed.');
      let relative;try{relative=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';}catch{fail(400,'Invalid path.');}
      if(relative.split('/').some(x=>x==='..'||x.startsWith('.'))||relative.includes('\\')||relative.includes('\0'))fail(404,'File not found.');
      const file=resolve(webRoot,relative);if(!file.startsWith(webRoot+sep)&&file!==resolve(webRoot,'index.html'))fail(404,'File not found.');
      const type=mime[extname(file)];if(!type)fail(404,'File not found.');let bytes;try{bytes=await readFile(file);}catch{fail(404,'File not found.');}
      res.setHeader('Cache-Control',extname(file)==='.html'?'no-store':'no-cache');res.writeHead(200,{'Content-Type':type});res.end(req.method==='HEAD'?undefined:bytes);
    }catch(e){if(!(e instanceof HttpError))log.error(e);if(!res.headersSent)json(res,e.status??500,{error:e instanceof HttpError?e.message:'Something went wrong. Please try again.'});else res.end();}
  });
  server.requestTimeout=15000;server.headersTimeout=10000;
  return {server,db,close:()=>new Promise((resolve,reject)=>{server.close(err=>{db.close();err?reject(err):resolve();});server.closeIdleConnections?.();})};
}
