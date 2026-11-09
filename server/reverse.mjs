import {createHash} from 'node:crypto';
import {categories} from '../data/catalogue.mjs';
import {verticals,guides,guideFor} from '../data/verticals.mjs';
import {id,now,transaction,audit,offerJSON,publicOfferSQL} from './db.mjs';
import {fail,text,amount,category,safeUrl,futureDate,searchCategory} from './domain.mjs';
import {requireUser,requireAdmin} from './auth.mjs';

const digest=value=>createHash('sha256').update(value).digest('hex');
const normalize=value=>String(value).trim().toLowerCase().replace(/\s+/g,' ');
const wholeAmount=(value,label)=>{
  if(!['string','number'].includes(typeof value))fail(400,`${label} must be a whole BDT amount.`);
  return amount(value,label);
};
function queryMatches(cat,haystack,query){
  if(!query)return true;
  const alias=searchCategory(query);
  if(alias)return cat===alias;
  const content=haystack.toLowerCase();
  return query.split(/\s+/).every(token=>content.includes(token)||searchCategory(token)===cat);
}
export const canonicalId=offer=>'scope-'+digest(JSON.stringify([normalize(offer.category),normalize(offer.comparisonGroup),normalize(offer.unit)])).slice(0,24);

export function initializeReverse(db){
  db.exec(`
    CREATE TABLE IF NOT EXISTS reverse_community_meta (
      deal_id TEXT PRIMARY KEY REFERENCES deals(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK(kind IN ('deal','coupon','discussion')),
      origin TEXT NOT NULL CHECK(origin IN ('community','merchant','editorial')),
      disclosure TEXT NOT NULL DEFAULT '', fees INTEGER NOT NULL DEFAULT 0 CHECK(fees>=0),
      has_price INTEGER NOT NULL DEFAULT 1, no_expiry INTEGER NOT NULL DEFAULT 0,
      location TEXT NOT NULL DEFAULT '', payment TEXT NOT NULL DEFAULT '',
      code TEXT NOT NULL DEFAULT '', comparison_group TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS reverse_votes (
      deal_id TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      value INTEGER NOT NULL CHECK(value IN (-1,1)), created_at TEXT NOT NULL,
      PRIMARY KEY(deal_id,user_id)
    );
    CREATE TABLE IF NOT EXISTS reverse_watches (
      id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      query TEXT NOT NULL,category TEXT,max_price INTEGER,created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reverse_watch_reads (
      watch_id TEXT NOT NULL REFERENCES reverse_watches(id) ON DELETE CASCADE,
      entity_key TEXT NOT NULL,signature TEXT NOT NULL,read_at TEXT NOT NULL,
      PRIMARY KEY(watch_id,entity_key)
    );
    CREATE TABLE IF NOT EXISTS reverse_reports (
      id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),
      kind TEXT NOT NULL CHECK(kind IN ('deal','offer')),entity_id TEXT NOT NULL,
      reason TEXT NOT NULL,detail TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','resolved','dismissed')),
      created_at TEXT NOT NULL,reviewed_at TEXT,reviewer_id TEXT REFERENCES users(id),decision_reason TEXT
    );
    CREATE INDEX IF NOT EXISTS reverse_watch_owner ON reverse_watches(user_id);
    CREATE INDEX IF NOT EXISTS reverse_report_queue ON reverse_reports(status,created_at);
  `);
}

function currentOffers(db){return db.prepare(publicOfferSQL+' ORDER BY o.price+o.fees,o.id').all(now()).map(offerJSON);}

function groupOffers(offers){
  const groups=new Map();
  for(const offer of offers){const key=canonicalId(offer);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(offer);}
  return [...groups].map(([id,items])=>{
    items.sort((a,b)=>a.total-b.total||a.id.localeCompare(b.id));
    const first=[...items].sort((a,b)=>a.id.localeCompare(b.id))[0];
    const attributes=Object.create(null),differences=[];
    for(const key of new Set(items.flatMap(o=>Object.keys(o.attributes)))){
      const values=items.map(o=>({offerId:o.id,value:Object.hasOwn(o.attributes,key)?o.attributes[key]:'Not specified'}));
      const distinct=[...new Set(values.map(v=>String(v.value)))];
      attributes[key]=distinct.length===1?distinct[0]:'Varies; compare provider terms';
      if(distinct.length>1)differences.push({name:key,values});
    }
    const locations=[...new Set(items.map(o=>o.location))].sort();
    return {id,title:first.title,category:first.category,comparisonGroup:first.comparisonGroup,
      unit:first.unit,location:locations.length===1?locations[0]:'Multiple locations',locations,
      lowestTotal:items[0].total,highestTotal:items.at(-1).total,
      merchantCount:new Set(items.map(o=>o.businessId)).size,offerCount:items.length,
      attributes,differences,art:first.art,isSample:items.every(o=>o.isSample),
      identityBasis:'Category, contributor-declared scope and billing unit.',equivalenceVerified:false,
      latestConfirmation:items.map(o=>o.confirmedAt).sort().at(-1),
      priceCompleteness:'Listed base price and mandatory fee fields; confirm any unlisted charges.',
      offers:items};
  });
}

const withoutOffers=({offers,...product})=>product;
function coverage(products){const offers=products.flatMap(p=>p.offers);return {
  groupCount:products.length,offerCount:offers.length,merchantCount:new Set(offers.map(o=>o.businessId)).size,
  illustrativeOfferCount:offers.filter(o=>o.isSample).length,asOf:now(),
  note:'Only approved, unexpired offers from approved providers are included. Group labels describe declared scope, not independently verified equivalence. Totals include listed mandatory fees; confirm any unlisted charges.',
  ranking:'Lowest listed payable total first; ties use a stable identifier. Conditional rebates do not reduce payable totals. Sponsored positions do not alter this order.',
  historyBasis:'Actual recorded individual-offer publication observations, not a continuous market-low history.'};}

function productSearch(products,params){
  const query=(params.get('q')??'').trim().toLowerCase().slice(0,160),cat=params.get('category')||searchCategory(query);
  if(cat)category(cat);
  let matches=products.filter(p=>!cat||p.category===cat);
  if(query)matches=matches.filter(p=>queryMatches(p.category,[p.title,p.comparisonGroup,...p.locations,...p.offers.flatMap(o=>[o.merchant,...Object.values(o.attributes)])].join(' '),query));
  const facets={categories:categories.map(c=>({id:c.id,name:c.name,count:matches.filter(p=>p.category===c.id).length})).filter(c=>c.count),
    locations:[...new Set(matches.flatMap(p=>p.locations))].sort().map(value=>({value,count:matches.filter(p=>p.locations.includes(value)).length})),
    price:{min:matches.length?Math.min(...matches.map(p=>p.lowestTotal)):null,max:matches.length?Math.max(...matches.map(p=>p.highestTotal)):null},
    schema:cat?verticals[cat].schema:[]};
  const location=params.get('location')?.trim().toLowerCase();
  if(location)matches=matches.map(p=>({...p,offers:p.offers.filter(o=>o.location.toLowerCase().includes(location)||o.location==='Bangladesh')})).filter(p=>p.offers.length).flatMap(p=>groupOffers(p.offers));
  if(params.has('max')&&params.get('max')!==''){const max=wholeAmount(params.get('max'),'Maximum total');matches=matches.filter(p=>p.lowestTotal<=max);}
  const sort=params.get('sort')??'price-asc';
  if(!['price-asc','price-desc','merchants','recent'].includes(sort))fail(400,'Choose a supported product sort.');
  matches.sort(sort==='price-desc'?(a,b)=>b.lowestTotal-a.lowestTotal||a.id.localeCompare(b.id):sort==='merchants'?(a,b)=>b.merchantCount-a.merchantCount||a.lowestTotal-b.lowestTotal:sort==='recent'?(a,b)=>b.latestConfirmation.localeCompare(a.latestConfirmation):((a,b)=>a.lowestTotal-b.lowestTotal||a.id.localeCompare(b.id)));
  return {products:matches.slice(0,200).map(withoutOffers),facets,total:matches.length};
}

function memberOrigin(db,user,requested){
  const ownsBusiness=Boolean(db.prepare('SELECT id FROM businesses WHERE owner_id=? LIMIT 1').get(user.id));
  if(requested==='editorial'&&user.role!=='admin')fail(403,'Editorial origin requires administrator access.');
  return ownsBusiness||requested==='merchant'?'merchant':user.role==='admin'?'editorial':'community';
}

function postRows(db,user){
  const rows=db.prepare(`SELECT d.*,u.name author,u.role author_role,m.kind,m.origin,m.disclosure,m.fees,m.has_price,m.no_expiry,m.location,m.payment,m.code,m.comparison_group,
    EXISTS(SELECT 1 FROM businesses b WHERE b.owner_id=d.user_id) owns_business,
    (SELECT COUNT(*) FROM comments c WHERE c.deal_id=d.id) comment_count
    FROM deals d JOIN users u ON u.id=d.user_id LEFT JOIN reverse_community_meta m ON m.deal_id=d.id
    WHERE d.status='approved' ORDER BY d.created_at,d.id`).all();
  return rows.map(row=>{
    const signed=db.prepare('SELECT COALESCE(SUM(value),0) heat FROM reverse_votes WHERE deal_id=?').get(row.id).heat;
    const legacy=db.prepare('SELECT COUNT(*) heat FROM votes v WHERE v.deal_id=? AND NOT EXISTS(SELECT 1 FROM reverse_votes s WHERE s.deal_id=v.deal_id AND s.user_id=v.user_id)').get(row.id).heat;
    const vote=user?(db.prepare('SELECT value FROM reverse_votes WHERE deal_id=? AND user_id=?').get(row.id,user.id)?.value??(db.prepare('SELECT user_id FROM votes WHERE deal_id=? AND user_id=?').get(row.id,user.id)?1:0)):0;
    const origin=row.owns_business||row.origin==='merchant'?'merchant':row.author_role==='admin'?'editorial':'community';
    const disclosure=row.disclosure||(origin==='merchant'?'Contributor operates a business on SaveSmart. Its relationship to this offer was not supplied.':origin==='editorial'?'Contribution from a SaveSmart administrator.':'');
    const hasPrice=row.kind!=='discussion'&&(row.has_price??1),fees=hasPrice?(row.fees??0):0;
    const feesDeclared=Boolean(hasPrice&&row.fees!==null&&row.fees!==undefined);
    const priceBasis=!hasPrice?'No fixed price supplied.':feesDeclared?'Base price plus declared mandatory fees.':'Listed price only: mandatory fees were not declared. Confirm the final payable amount.';
    const expiresAt=row.no_expiry?null:row.expires_at;
    return {id:row.id,title:row.title,category:row.category,price:hasPrice?row.price:null,fees,feesDeclared,priceBasis,total:hasPrice?row.price+fees:null,
      terms:row.terms,url:row.url,author:row.author,kind:row.kind??'deal',origin,disclosure,
      expiresAt,expired:expiresAt?expiresAt<=now():false,heat:signed+legacy,vote,commentCount:row.comment_count,
      isSample:Boolean(row.is_sample),createdAt:row.created_at,location:row.location??'',payment:row.payment??'',code:row.code??'',comparisonGroup:row.comparison_group??''};
  });
}

function postEvidence(post,products){
  const candidates=products.filter(p=>p.category===post.category&&p.comparisonGroup===post.comparisonGroup);
  if(candidates.length>1)return {status:'unavailable',description:'This declared group contains multiple billing units. Select an exact comparison scope before using a price reference.',savingsPercent:null};
  const group=candidates[0];
  if(!group||post.total===null)return {status:'unavailable',description:'No verified comparable price evidence is attached. Community heat is sentiment, not a savings calculation.',savingsPercent:null};
  return {status:'context',description:'Current offers for the contributor-declared comparison group. Exact scope and eligibility have not been independently verified against this post; no savings percentage is claimed.',comparisonGroup:group.comparisonGroup,
    lowestComparableTotal:group.lowestTotal,offerCount:group.offerCount,asOf:now(),productId:group.id,savingsPercent:null,
    offers:group.offers.map(o=>({id:o.id,total:o.total,merchant:o.merchant,confirmedAt:o.confirmedAt}))};
}

function ownedWatch(db,watchId,user){requireUser(user);const row=db.prepare('SELECT * FROM reverse_watches WHERE id=? AND user_id=?').get(watchId,user.id);if(!row)fail(404,'Watch not found.');return row;}
function watchMatches(db,watch,products,posts){
  const query=watch.query.toLowerCase();
  const match=(category,title,total,extra='',feesDeclared=true)=>(!watch.category||category===watch.category)&&queryMatches(category,title+' '+extra,query)&&(watch.max_price===null||(feesDeclared&&total!==null&&total<=watch.max_price));
  const candidates=[...products.filter(p=>match(p.category,p.title,p.lowestTotal,[p.comparisonGroup,...p.offers.flatMap(o=>[o.merchant,...Object.values(o.attributes)])].join(' '))).map(p=>({id:p.id,kind:'product',title:p.title,total:p.lowestTotal,href:'#/product/'+p.id,signature:digest(JSON.stringify(p.offers.map(o=>[o.id,o.total,o.confirmedAt,o.title,o.location,o.payment,o.attributes])))})),
    ...posts.filter(p=>!p.expired&&match(p.category,p.title,p.total,p.terms,p.feesDeclared)).map(p=>({id:p.id,kind:'deal',title:p.title,total:p.total,feesDeclared:p.feesDeclared,priceBasis:p.priceBasis,href:'#/deal/'+p.id,signature:digest(JSON.stringify([p.id,p.title,p.total,p.terms,p.code,p.payment,p.location,p.disclosure,p.createdAt,p.expiresAt,p.feesDeclared]))}))];
  const reads=new Map(db.prepare('SELECT entity_key,signature FROM reverse_watch_reads WHERE watch_id=?').all(watch.id).map(r=>[r.entity_key,r.signature]));
  return candidates.slice(0,200).map(c=>({...c,unread:reads.get(c.kind+':'+c.id)!==c.signature}));
}

export function createReverseHandler({db,body,json,rate}){
  return async function handleReverse({req,res,url,user}){
    const path=url.pathname,method=req.method;let route;
    const send=(status,payload)=>{json(res,status,payload);return true;};
    if(method==='GET'&&path==='/api/discover'){
      const products=groupOffers(currentOffers(db));return send(200,{categories:categories.map(c=>({...c,...coverage(products.filter(p=>p.category===c.id))})),coverage:coverage(products)});
    }
    if(method==='GET'&&path==='/api/products')return send(200,productSearch(groupOffers(currentOffers(db)),url.searchParams));
    if(method==='GET'&&(route=path.match(/^\/api\/products\/([^/]+)$/))){
      const product=groupOffers(currentOffers(db)).find(p=>p.id===route[1]);if(!product)fail(404,'This comparison scope has no current approved offers.');
      const history=[];for(const o of product.offers)for(const point of db.prepare('SELECT total,recorded_at FROM price_history WHERE offer_id=? ORDER BY recorded_at DESC LIMIT 200').all(o.id))history.push({...point,offerId:o.id,merchant:o.merchant});
      history.sort((a,b)=>a.recorded_at.localeCompare(b.recorded_at)||a.offerId.localeCompare(b.offerId));
      return send(200,{product:withoutOffers(product),offers:product.offers,history:history.slice(-200),coverage:coverage([product])});
    }
    if(method==='GET'&&(route=path.match(/^\/api\/sectors\/([^/]+)$/))){
      const cat=categories.find(c=>c.id===route[1]);if(!cat)fail(404,'Industry not found.');const products=groupOffers(currentOffers(db)).filter(p=>p.category===cat.id);
      return send(200,{category:{...cat,...coverage(products)},schema:verticals[cat.id].schema,guide:guideFor(cat.id),products:products.map(withoutOffers),coverage:coverage(products)});
    }
    if(method==='GET'&&path==='/api/guides')return send(200,{guides});
    if(method==='GET'&&(route=path.match(/^\/api\/guides\/([^/]+)$/))){const guide=guides.find(g=>g.id===route[1]);if(!guide)fail(404,'Guide not found.');return send(200,{guide});}
    if(method==='GET'&&path==='/api/community'){
      let posts=postRows(db,user);const q=(url.searchParams.get('q')??'').trim().toLowerCase().slice(0,160),cat=url.searchParams.get('category'),kind=url.searchParams.get('kind');
      if(cat){category(cat);posts=posts.filter(p=>p.category===cat);}if(kind){if(!['deal','coupon','discussion'].includes(kind))fail(400,'Choose a supported post type.');posts=posts.filter(p=>p.kind===kind);}
      const include=['1','true','include'].includes(url.searchParams.get('expired'))||['1','true'].includes(url.searchParams.get('includeExpired'));
      if(!include)posts=posts.filter(p=>!p.expired);
      if(q)posts=posts.filter(p=>[p.title,p.terms,p.author,p.code].join(' ').toLowerCase().includes(q));
      if(url.searchParams.has('max')&&url.searchParams.get('max')!==''){const max=wholeAmount(url.searchParams.get('max'),'Maximum total');posts=posts.filter(p=>p.feesDeclared&&p.total!==null&&p.total<=max);}
      const sort=url.searchParams.get('sort')??'hot';if(!['hot','latest','discussed','expiring'].includes(sort))fail(400,'Choose a supported community sort.');
      posts.sort(sort==='latest'?(a,b)=>b.createdAt.localeCompare(a.createdAt):sort==='discussed'?(a,b)=>b.commentCount-a.commentCount||b.createdAt.localeCompare(a.createdAt):sort==='expiring'?(a,b)=>(a.expiresAt??'9999').localeCompare(b.expiresAt??'9999'):(a,b)=>b.heat-a.heat||b.createdAt.localeCompare(a.createdAt));
      return send(200,{posts:posts.slice(0,200),total:posts.length});
    }
    if(method==='GET'&&(route=path.match(/^\/api\/community\/([^/]+)$/))){
      const post=postRows(db,user).find(p=>p.id===route[1]);if(!post)fail(404,'Published post not found.');
      const comments=db.prepare('SELECT c.id,c.body,c.created_at,u.name author FROM comments c JOIN users u ON u.id=c.user_id WHERE c.deal_id=? ORDER BY c.created_at LIMIT 100').all(post.id);
      return send(200,{post,comments,evidence:postEvidence(post,groupOffers(currentOffers(db)))});
    }
    if(method==='POST'&&path==='/api/community'){
      requireUser(user);rate(req,'community-submit',25);const b=await body(req),kind=b.kind??'deal';if(!['deal','coupon','discussion'].includes(kind))fail(400,'Choose deal, coupon or discussion.');
      if(b.origin&&!['community','merchant','editorial','member','staff'].includes(b.origin))fail(400,'Choose a supported contributor origin.');
      const origin=memberOrigin(db,user,b.origin==='staff'?'editorial':b.origin),disclosure=origin==='merchant'?text(b.disclosure,'Commercial relationship disclosure',5,1000):b.disclosure?text(b.disclosure,'Disclosure',1,1000):'';
      const hasPrice=kind==='deal'||(kind==='coupon'&&b.price!==undefined&&b.price!==null&&b.price!=='');const price=hasPrice?wholeAmount(b.price,'Price'):0,fees=hasPrice?wholeAmount(b.fees,'Mandatory fees'):0;
      const code=kind==='coupon'?text(b.code,'Coupon code',2,80):'',link=safeUrl(b.url);if(kind==='coupon'&&!link)fail(400,'A coupon needs a source or redemption link.');
      const expires=kind==='discussion'?'9999-12-31T00:00:00.000Z':futureDate(b.expiresAt),did=id('deal'),group=b.comparisonGroup?text(b.comparisonGroup,'Comparison group',3,100):'';
      if(group&&!/^[a-z0-9-]+$/.test(group))fail(400,'Use a valid lowercase comparison group.');
      const location=b.location?text(b.location,'Location',2,100):'',payment=b.payment?text(b.payment,'Payment method',2,60):'';
      transaction(db,()=>{db.prepare('INSERT INTO deals VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(did,user.id,text(b.title,'Post title',5,140),category(b.category),price,text(b.terms,'Terms or discussion',20,4000),link,'pending',0,expires,now());db.prepare('INSERT INTO reverse_community_meta VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(did,kind,origin,disclosure,fees,hasPrice?1:0,kind==='discussion'?1:0,location,payment,code,group);audit(db,user,'community.submitted',did,kind+'; '+origin);});
      return send(201,{id:did,status:'pending'});
    }
    if(method==='POST'&&(route=path.match(/^\/api\/community\/([^/]+)\/comments$/))){
      requireUser(user);rate(req,'community-comment',60);
      const post=postRows(db,user).find(p=>p.id===route[1]);
      if(!post)fail(404,'Published post not found.');
      if(post.expired)fail(409,'An expired offer remains readable but cannot receive new comments.');
      const b=await body(req),cid=id('comment');
      db.prepare('INSERT INTO comments VALUES(?,?,?,?,?)').run(cid,post.id,user.id,text(b.body,'Comment',2,1000),now());
      return send(201,{id:cid,ok:true});
    }
    if(method==='POST'&&(route=path.match(/^\/api\/community\/([^/]+)\/vote$/))){
      requireUser(user);rate(req,'community-vote',120);const b=await body(req);if(![-1,0,1].includes(b.value))fail(400,'Vote must be -1, 0 or 1.');const post=postRows(db,user).find(p=>p.id===route[1]);if(!post)fail(404,'Published post not found.');if(post.expired)fail(409,'An expired offer remains readable but cannot receive active votes.');
      transaction(db,()=>{db.prepare('DELETE FROM votes WHERE deal_id=? AND user_id=?').run(post.id,user.id);if(b.value===0)db.prepare('DELETE FROM reverse_votes WHERE deal_id=? AND user_id=?').run(post.id,user.id);else db.prepare('INSERT INTO reverse_votes VALUES(?,?,?,?) ON CONFLICT(deal_id,user_id) DO UPDATE SET value=excluded.value,created_at=excluded.created_at').run(post.id,user.id,b.value,now());});const updated=postRows(db,user).find(p=>p.id===post.id);return send(200,{heat:updated.heat,vote:updated.vote});
    }
    if(method==='GET'&&path==='/api/watches'){
      requireUser(user);const products=groupOffers(currentOffers(db)),posts=postRows(db,user);
      const watches=db.prepare('SELECT * FROM reverse_watches WHERE user_id=? ORDER BY created_at DESC,id').all(user.id).map(w=>{const matches=watchMatches(db,w,products,posts).map(({signature,...m})=>m);return {id:w.id,query:w.query,category:w.category,maxPrice:w.max_price,createdAt:w.created_at,matches,unreadCount:matches.filter(m=>m.unread).length};});return send(200,{watches});
    }
    if(method==='POST'&&path==='/api/watches'){
      requireUser(user);rate(req,'watch-create',30);const b=await body(req),query=b.query?text(b.query,'Search term',2,160):'',cat=b.category?category(b.category):null;
      if(!query&&!cat)fail(400,'Choose a category or enter a search term.');if(db.prepare('SELECT COUNT(*) n FROM reverse_watches WHERE user_id=?').get(user.id).n>=50)fail(409,'You can keep up to 50 watches.');
      const max=b.maxPrice===undefined||b.maxPrice===null||b.maxPrice===''?null:wholeAmount(b.maxPrice,'Maximum total'),wid=id('watch');db.prepare('INSERT INTO reverse_watches VALUES(?,?,?,?,?,?)').run(wid,user.id,query,cat,max,now());return send(201,{id:wid,query,category:cat,maxPrice:max});
    }
    if(method==='DELETE'&&(route=path.match(/^\/api\/watches\/([^/]+)$/))){const watch=ownedWatch(db,route[1],user);db.prepare('DELETE FROM reverse_watches WHERE id=?').run(watch.id);return send(200,{ok:true});}
    if(method==='POST'&&(route=path.match(/^\/api\/watches\/([^/]+)\/read$/))){
      const watch=ownedWatch(db,route[1],user),matches=watchMatches(db,watch,groupOffers(currentOffers(db)),postRows(db,user));transaction(db,()=>{for(const m of matches)db.prepare('INSERT INTO reverse_watch_reads VALUES(?,?,?,?) ON CONFLICT(watch_id,entity_key) DO UPDATE SET signature=excluded.signature,read_at=excluded.read_at').run(watch.id,m.kind+':'+m.id,m.signature,now());});return send(200,{ok:true,markedRead:matches.length});
    }
    if(method==='POST'&&path==='/api/reports'){
      requireUser(user);rate(req,'report-create',25);const b=await body(req);if(!['deal','offer'].includes(b.kind))fail(400,'Choose deal or offer.');const entity=text(b.entityId,'Reported item',1,100);
      if(b.kind==='deal'?!postRows(db,user).some(p=>p.id===entity):!currentOffers(db).some(o=>o.id===entity))fail(404,'Published item not found.');
      const existing=db.prepare("SELECT id,status FROM reverse_reports WHERE user_id=? AND kind=? AND entity_id=? AND status='pending'").get(user.id,b.kind,entity);if(existing)return send(200,existing);
      const rid=id('report');db.prepare('INSERT INTO reverse_reports VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(rid,user.id,b.kind,entity,text(b.reason,'Reason',3,120),b.detail?text(b.detail,'Report details',1,2000):'','pending',now(),null,null,null);audit(db,user,'report.submitted',rid,b.kind+':'+entity);return send(201,{id:rid,status:'pending'});
    }
    if(method==='GET'&&path==='/api/moderation'){
      requireAdmin(user);return send(200,{reports:db.prepare('SELECT r.*,u.name reporter_name FROM reverse_reports r JOIN users u ON u.id=r.user_id ORDER BY CASE r.status WHEN \'pending\' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 200').all().map(r=>{
        const table={deal:'deals',offer:'offers'}[r.kind],publication=db.prepare(`SELECT status FROM ${table} WHERE id=?`).get(r.entity_id);
        return {id:r.id,kind:r.kind,entityId:r.entity_id,reason:r.reason,detail:r.detail,status:r.status,createdAt:r.created_at,reviewedAt:r.reviewed_at,decisionReason:r.decision_reason,reporterName:r.reporter_name,publicationStatus:publication?.status??'missing',canWithdraw:publication?.status==='approved'};
      })});
    }
    if(method==='POST'&&path==='/api/moderation/withdraw'){
      requireAdmin(user);rate(req,'moderation-withdraw',30);const b=await body(req);
      if(!['deal','offer'].includes(b.kind))fail(400,'Choose deal or offer.');
      const table=b.kind==='deal'?'deals':'offers';
      const entity=text(b.entityId,'Published item',1,100),reason=text(b.reason,'Withdrawal reason',10,1000);
      transaction(db,()=>{
        const record=db.prepare(`SELECT id FROM ${table} WHERE id=? AND status='approved'`).get(entity);
        if(!record)fail(404,'Approved publication not found.');
        db.prepare(`UPDATE ${table} SET status='rejected' WHERE id=?`).run(entity);
        audit(db,user,b.kind+'.withdrawn',entity,reason);
      });
      return send(200,{ok:true,status:'rejected'});
    }
    if(method==='POST'&&(route=path.match(/^\/api\/reports\/([^/]+)\/review$/))){
      requireAdmin(user);const b=await body(req);if(!['resolved','dismissed'].includes(b.decision))fail(400,'Choose resolved or dismissed.');const r=db.prepare("SELECT * FROM reverse_reports WHERE id=? AND status='pending'").get(route[1]);if(!r)fail(404,'Pending report not found.');const reason=text(b.reason,'Decision reason',5,1000);
      transaction(db,()=>{db.prepare('UPDATE reverse_reports SET status=?,reviewed_at=?,reviewer_id=?,decision_reason=? WHERE id=?').run(b.decision,now(),user.id,reason,r.id);audit(db,user,'report.'+b.decision,r.id,reason);});return send(200,{id:r.id,status:b.decision,publicationChanged:false});
    }
    return false;
  };
}
