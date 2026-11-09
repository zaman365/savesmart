import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../server/app.mjs';
import {canonicalId,initializeReverse} from '../server/reverse.mjs';
import {request,login,tomorrow} from './helpers.mjs';

let app,buyer,merchant,other,admin;
before(async()=>{
  app=await createApp({demoMode:true});
  [buyer,merchant,other,admin]=await Promise.all(['buyer','merchant','other','admin'].map(role=>login(app,role)));
});
after(()=>app.db.close());
const post=(path,body,cookie=buyer)=>request(app,path,{method:'POST',body,cookie});
const get=(path,cookie='')=>request(app,path,{cookie});
const newDeal=(overrides={})=>({kind:'deal',title:'A complete family escape offer',category:'travel',price:21000,fees:1200,terms:'Three nights for two adults. Confirm travel dates and cancellation with the provider.',url:'https://example.com/terms',expiresAt:tomorrow(),...overrides});
async function approve(id){const r=await post('/api/admin/review',{kind:'deal',id,decision:'approved',reason:'Reviewed supplied terms and disclosure.'},admin);assert.equal(r.status,200,JSON.stringify(r.data));}

test('canonical identity includes category, normalized scope and billing unit, never price',()=>{
  const a={category:'travel',comparisonGroup:'CoX-family-3n',unit:'3 nights · 2 adults',price:1};
  assert.equal(canonicalId(a),canonicalId({...a,comparisonGroup:' cox-family-3n ',price:900}));
  assert.notEqual(canonicalId(a),canonicalId({...a,category:'automotive'}));
  assert.notEqual(canonicalId(a),canonicalId({...a,unit:'night'}));
});

test('canonical search turns three merchant offers into one scope with truthful counts',async()=>{
  const r=await get('/api/products?category=travel');assert.equal(r.status,200);
  assert.equal(r.data.total,1);const p=r.data.products[0];
  assert.equal(p.offerCount,3);assert.equal(p.merchantCount,3);assert.equal(p.lowestTotal,25000);assert.equal(p.highestTotal,29100);
  assert.ok(p.isSample);assert.equal(p.equivalenceVerified,false);assert.match(p.identityBasis,/contributor-declared scope/);assert.match(p.attributes.Option,/Varies/);assert.ok(p.differences.some(d=>d.name==='Option'));
  assert.equal('offers' in p,false);assert.equal(r.data.facets.locations[0].value,'Cox’s Bazar');
});

test('category discovery, original guides and comparison schemas span all twelve industries',async()=>{
  const d=await get('/api/discover');assert.equal(d.status,200);assert.equal(d.data.categories.length,12);assert.equal(d.data.coverage.groupCount,12);assert.equal(d.data.coverage.offerCount,36);assert.equal(d.data.coverage.illustrativeOfferCount,36);
  const g=await get('/api/guides');assert.equal(g.data.guides.length,12);
  for(const c of d.data.categories){
    const s=await get('/api/sectors/'+c.id);assert.equal(s.status,200);assert.ok(s.data.schema.length>=3);assert.equal(s.data.guide.category,c.id);assert.ok(s.data.guide.sections.every(section=>section.title&&section.body));
    assert.equal((await get('/api/guides/'+s.data.guide.id)).status,200);
  }
  assert.equal((await get('/api/sectors/unsupported')).status,404);
});

test('product filters use payable total and support Bangla intent and provider location',async()=>{
  assert.equal((await get('/api/products?q='+encodeURIComponent('ভ্রমণ'))).data.total,1);
  assert.equal((await get('/api/products?q=Extended')).data.total,12);
  assert.equal((await get('/api/products?q=travel%20Extended')).data.total,1);
  assert.equal((await get('/api/products?category=travel&q=home')).data.total,0);
  assert.equal((await get('/api/products?q=family%20Flexible')).data.total,2);
  assert.equal((await get('/api/products?category=travel&max=24000')).data.total,0);
  assert.equal((await get('/api/products?category=travel&max=25000')).data.total,1);
  assert.equal((await get('/api/products?category=travel&location=Dhaka')).data.total,0);
  assert.equal((await get('/api/products?category=education&location=Dhaka')).data.total,1);
  assert.equal((await get('/api/products?max=-1')).status,400);assert.equal((await get('/api/products?sort=invented')).status,400);
});

test('canonical detail orders merchant rows by full cost and contains recorded observations only',async()=>{
  const p=(await get('/api/products?category=travel')).data.products[0];
  const r=await get('/api/products/'+p.id);assert.equal(r.status,200);assert.deepEqual(r.data.offers.map(o=>o.total),[25000,27100,29100]);
  assert.equal(r.data.history.length,3);assert.ok(r.data.history.every(h=>h.offerId&&h.recorded_at&&Number.isInteger(h.total)));
  assert.match(r.data.coverage.historyBasis,/individual-offer/);assert.match(r.data.coverage.note,/declared scope/);
  assert.equal(r.data.offers[0].rebate,500);assert.equal(r.data.product.lowestTotal,25000);
});

test('material merchant attributes cannot be hidden by inherited JavaScript property names',async()=>{
  const row=app.db.prepare("SELECT attributes FROM offers WHERE id='offer-travel-1'").get();
  try{
    const attributes=JSON.parse(row.attributes);
    Object.defineProperty(attributes,'__proto__',{value:'Provider-declared scope detail',enumerable:true});
    attributes.constructor='Provider-declared condition';
    app.db.prepare("UPDATE offers SET attributes=? WHERE id='offer-travel-1'").run(JSON.stringify(attributes));
    const product=(await get('/api/products?category=travel')).data.products[0];
    assert.ok(Object.hasOwn(product.attributes,'__proto__'));
    for(const name of ['__proto__','constructor']){
      const difference=product.differences.find(d=>d.name===name);
      assert.ok(difference);
      assert.equal(difference.values.filter(v=>v.value==='Not specified').length,2);
    }
  }finally{app.db.prepare("UPDATE offers SET attributes=? WHERE id='offer-travel-1'").run(row.attributes);}
});

test('pending, expired and disapproved-provider offers leave canonical scope immediately',async()=>{
  const ids=['offer-travel-1','offer-travel-2','offer-travel-3'];
  const originals=ids.map(id=>app.db.prepare('SELECT * FROM offers WHERE id=?').get(id));
  try{
    app.db.prepare("UPDATE offers SET status='pending' WHERE id=?").run(ids[0]);
    app.db.prepare('UPDATE offers SET expires_at=? WHERE id=?').run('2000-01-01',ids[1]);
    app.db.prepare("UPDATE businesses SET status='rejected' WHERE id='sample-travel-3'").run();
    assert.equal((await get('/api/products?category=travel')).data.total,0);
    const scope=canonicalId({category:originals[0].category,comparisonGroup:originals[0].comparison_group,unit:originals[0].unit});
    assert.equal((await get('/api/products/'+scope)).status,404);
  }finally{
    for(const o of originals)app.db.prepare('UPDATE offers SET status=?,expires_at=? WHERE id=?').run(o.status,o.expires_at,o.id);
    app.db.prepare("UPDATE businesses SET status='approved' WHERE id='sample-travel-3'").run();
  }
});

test('a low base price with high fees cannot displace a lower payable total',async()=>{
  const row=app.db.prepare("SELECT * FROM offers WHERE id='offer-home-1'").get();
  try{
    app.db.prepare("UPDATE offers SET price=1,fees=3000,rebate=3000 WHERE id='offer-home-1'").run();
    const p=(await get('/api/products?category=home')).data.products[0];
    const r=await get('/api/products/'+p.id);assert.equal(r.data.offers[0].id,'offer-home-2');assert.equal(p.lowestTotal,1450);assert.equal(p.highestTotal,3001);
    assert.equal(p.id,canonicalId({category:row.category,comparisonGroup:row.comparison_group,unit:row.unit}));
  }finally{app.db.prepare('UPDATE offers SET price=?,fees=?,rebate=? WHERE id=?').run(row.price,row.fees,row.rebate,row.id);}
});

test('community deals store mandatory fees, remain pending and expose context without invented savings',async()=>{
  const missingFees=newDeal();delete missingFees.fees;assert.equal((await post('/api/community',missingFees)).status,400);
  const r=await post('/api/community',newDeal({comparisonGroup:'cox-family-3n'}));assert.equal(r.status,201);assert.equal(r.data.status,'pending');
  assert.equal((await get('/api/community/'+r.data.id)).status,404);await approve(r.data.id);
  const d=await get('/api/community/'+r.data.id);assert.equal(d.data.post.total,22200);assert.equal(d.data.post.origin,'community');assert.equal(d.data.post.feesDeclared,true);
  assert.equal(d.data.evidence.status,'context');assert.equal(d.data.evidence.savingsPercent,null);assert.equal(d.data.evidence.offerCount,3);assert.match(d.data.evidence.description,/not been independently verified/);
});

test('community price context refuses an ambiguous billing unit in the same declared group',async()=>{
  const r=await post('/api/community',newDeal({comparisonGroup:'cox-family-3n'}));await approve(r.data.id);
  const row=app.db.prepare("SELECT unit FROM offers WHERE id='offer-travel-3'").get();
  try{
    app.db.prepare("UPDATE offers SET unit='night' WHERE id='offer-travel-3'").run();
    assert.equal((await get('/api/products?category=travel')).data.total,2);
    const evidence=(await get('/api/community/'+r.data.id)).data.evidence;
    assert.equal(evidence.status,'unavailable');assert.equal(evidence.savingsPercent,null);assert.match(evidence.description,/multiple billing units/);assert.equal('lowestComparableTotal' in evidence,false);
  }finally{app.db.prepare("UPDATE offers SET unit=? WHERE id='offer-travel-3'").run(row.unit);}
});

test('discussions need no fictional price, expiry or product savings and support actual comments',async()=>{
  const r=await post('/api/community',{kind:'discussion',category:'automotive',title:'How do we compare annual car costs?',terms:'What maintenance, fuel and resale assumptions should a first-time buyer compare?'});assert.equal(r.status,201);await approve(r.data.id);
  const d=await get('/api/community/'+r.data.id);assert.equal(d.data.post.price,null);assert.equal(d.data.post.total,null);assert.equal(d.data.post.expiresAt,null);assert.equal(d.data.post.expired,false);assert.equal(d.data.evidence.status,'unavailable');
  const raw='<script>literal contribution</script>';assert.equal((await post('/api/community/'+r.data.id+'/comments',{body:raw})).status,201);
  assert.equal((await get('/api/community/'+r.data.id)).data.comments.at(-1).body,raw);
});

test('coupon composer requires both a redemption code and a public source link',async()=>{
  const b=newDeal({kind:'coupon',price:null,code:'FAMILY10'});
  assert.equal((await post('/api/community',{...b,code:''})).status,400);assert.equal((await post('/api/community',{...b,url:''})).status,400);assert.equal((await post('/api/community',{...b,url:'javascript:alert(1)'})).status,400);
  const r=await post('/api/community',b);assert.equal(r.status,201);await approve(r.data.id);
  const d=(await get('/api/community/'+r.data.id)).data.post;assert.equal(d.kind,'coupon');assert.equal(d.code,'FAMILY10');assert.equal(d.price,null);
});

test('commercial origin cannot be hidden by selecting community and editorial origin is protected',async()=>{
  assert.equal((await post('/api/community',newDeal({origin:'community'}),merchant)).status,400);
  assert.equal((await post('/api/community',newDeal({origin:'editorial'}),buyer)).status,403);
  const r=await post('/api/community',newDeal({origin:'community',disclosure:'I operate the provider offering this package.'}),merchant);assert.equal(r.status,201);await approve(r.data.id);
  const d=(await get('/api/community/'+r.data.id)).data.post;assert.equal(d.origin,'merchant');assert.match(d.disclosure,/operate the provider/);
  const legacy=await post('/api/deals',newDeal(),merchant);assert.equal(legacy.status,201);await approve(legacy.data.id);
  assert.equal((await get('/api/community/'+legacy.data.id)).data.post.origin,'merchant');assert.equal((await get('/api/community/'+legacy.data.id)).data.post.feesDeclared,false);assert.match((await get('/api/community/'+legacy.data.id)).data.post.priceBasis,/fees were not declared/);assert.match((await get('/api/community/'+legacy.data.id)).data.post.disclosure,/relationship.*not supplied/);
});

test('signed votes switch, clear and never double-count a legacy positive vote',async()=>{
  const r=await post('/api/community',newDeal());await approve(r.data.id);const path='/api/community/'+r.data.id+'/vote';
  assert.equal((await request(app,path,{method:'POST',body:{value:1}})).status,401);
  assert.equal((await post(path,{value:2})).status,400);assert.equal((await post(path,{value:'1'})).status,400);
  await post('/api/deals/'+r.data.id+'/vote',{});assert.equal((await get('/api/community/'+r.data.id,buyer)).data.post.heat,1);
  assert.deepEqual((await post(path,{value:-1})).data,{heat:-1,vote:-1});
  await post('/api/deals/'+r.data.id+'/vote',{});assert.equal((await get('/api/community/'+r.data.id,buyer)).data.post.heat,-1);
  assert.deepEqual((await post(path,{value:1})).data,{heat:1,vote:1});assert.deepEqual((await post(path,{value:0})).data,{heat:0,vote:0});
});

test('expired threads remain readable and reportable while active feed, votes and comments exclude them',async()=>{
  const r=await post('/api/community',newDeal());await approve(r.data.id);app.db.prepare('UPDATE deals SET expires_at=? WHERE id=?').run('2000-01-01',r.data.id);
  assert.equal((await get('/api/community/'+r.data.id)).data.post.expired,true);
  assert.ok(!(await get('/api/community')).data.posts.some(p=>p.id===r.data.id));assert.ok((await get('/api/community?expired=include')).data.posts.some(p=>p.id===r.data.id));
  assert.equal((await post('/api/community/'+r.data.id+'/vote',{value:1})).status,409);assert.equal((await post('/api/community/'+r.data.id+'/comments',{body:'Is this still available?'})).status,409);
  assert.equal((await post('/api/reports',{kind:'deal',entityId:r.data.id,reason:'expired',detail:'The advertised period has ended.'})).status,201);
});

test('community filters distinguish types and total cost, with supported sort validation',async()=>{
  const r=await get('/api/community?kind=discussion&category=automotive&sort=discussed');assert.equal(r.status,200);assert.ok(r.data.posts.length);assert.ok(r.data.posts.every(p=>p.kind==='discussion'&&p.category==='automotive'));
  const q=await get('/api/community?category=travel&max=22000');assert.ok(q.data.posts.every(p=>p.feesDeclared&&p.total!==null&&p.total<=22000));
  const bounded=await get('/api/community?category=travel&max=30000');assert.ok(bounded.data.posts.some(p=>p.feesDeclared&&p.total===22200));assert.ok(!bounded.data.posts.some(p=>p.id==='deal-1'));
  assert.ok((await get('/api/community?category=home')).data.posts.some(p=>p.id==='deal-2'&&!p.feesDeclared));
  assert.ok(!(await get('/api/community?category=home&max=1400')).data.posts.some(p=>p.id==='deal-2'));
  assert.equal((await get('/api/community?kind=other')).status,400);assert.equal((await get('/api/community?sort=other')).status,400);
});

test('saved watches are private, respect the maximum total and have persistent read signatures',async()=>{
  assert.equal((await get('/api/watches')).status,401);assert.equal((await post('/api/watches',{})).status,400);
  const r=await post('/api/watches',{query:'',category:'home',maxPrice:1400});assert.equal(r.status,201);
  const path='/api/watches/'+r.data.id;
  let w=(await get('/api/watches',buyer)).data.watches.find(w=>w.id===r.data.id);assert.equal(w.matches.length,1);assert.ok(w.matches.every(m=>m.kind==='product'&&m.total===1200));assert.equal(w.unreadCount,1);assert.ok(w.matches.every(m=>m.href.startsWith('#/')));
  assert.ok(!(await get('/api/watches',other)).data.watches.some(w=>w.id===r.data.id));assert.equal((await post(path+'/read',{},other)).status,404);assert.equal((await request(app,path,{method:'DELETE',cookie:other})).status,404);
  assert.equal((await post(path+'/read',{})).status,200);w=(await get('/api/watches',buyer)).data.watches.find(w=>w.id===r.data.id);assert.equal(w.unreadCount,0);
  app.db.prepare("UPDATE offers SET price=1199 WHERE id='offer-home-1'").run();
  try{assert.equal((await get('/api/watches',buyer)).data.watches.find(w=>w.id===r.data.id).unreadCount,1);}finally{app.db.prepare("UPDATE offers SET price=1200 WHERE id='offer-home-1'").run();}
  const unbounded=await post('/api/watches',{category:'home'});assert.equal(unbounded.status,201);
  assert.equal((await post('/api/watches/'+unbounded.data.id+'/read',{})).status,200);
  const offer=app.db.prepare("SELECT attributes FROM offers WHERE id='offer-home-1'").get(),deal=app.db.prepare("SELECT terms FROM deals WHERE id='deal-2'").get();
  try{
    app.db.prepare("UPDATE offers SET attributes=? WHERE id='offer-home-1'").run(JSON.stringify({...JSON.parse(offer.attributes),Parts:'Changed provider condition'}));
    assert.equal((await get('/api/watches',buyer)).data.watches.find(w=>w.id===r.data.id).unreadCount,1);
    app.db.prepare("UPDATE offers SET attributes=? WHERE id='offer-home-1'").run(offer.attributes);
    app.db.prepare("UPDATE deals SET terms=? WHERE id='deal-2'").run('Updated service conditions; parts and travel charges require confirmation.');
    const watch=(await get('/api/watches',buyer)).data.watches.find(w=>w.id===unbounded.data.id);
    assert.equal(watch.unreadCount,1);
    assert.equal(watch.matches.find(m=>m.kind==='deal').feesDeclared,false);
  }finally{
    app.db.prepare("UPDATE offers SET attributes=? WHERE id='offer-home-1'").run(offer.attributes);
    app.db.prepare("UPDATE deals SET terms=? WHERE id='deal-2'").run(deal.terms);
  }
  assert.equal((await request(app,path,{method:'DELETE',cookie:buyer})).status,200);assert.equal((await post(path+'/read',{})).status,404);
});

test('watch search matches current canonical scopes and published community posts without leaking pending content',async()=>{
  const pending=await post('/api/community',newDeal({title:'A watch-only unpublished package'}));assert.equal(pending.status,201);
  const w=await post('/api/watches',{query:'watch-only',category:'travel',maxPrice:null});
  assert.equal((await get('/api/watches',buyer)).data.watches.find(x=>x.id===w.data.id).matches.length,0);
  await approve(pending.data.id);const match=(await get('/api/watches',buyer)).data.watches.find(x=>x.id===w.data.id).matches[0];assert.equal(match.id,pending.data.id);assert.equal(match.kind,'deal');assert.equal(match.unread,true);
  const scoped=await post('/api/watches',{query:'travel Extended',category:'travel'}),conflict=await post('/api/watches',{query:'home',category:'travel'});
  const watches=(await get('/api/watches',buyer)).data.watches;
  assert.equal(watches.find(x=>x.id===scoped.data.id).matches.length,1);
  assert.equal(watches.find(x=>x.id===conflict.data.id).matches.length,0);
});

test('monetary JSON fields reject booleans, arrays and objects instead of coercing them to BDT',async()=>{
  const isolated=await createApp({demoMode:true});
  try{
    const cookie=await login(isolated);
    for(const value of [false,true,[],[1200],{}]){
      const response=await request(isolated,'/api/watches',{method:'POST',cookie,body:{category:'home',maxPrice:value}});
      assert.equal(response.status,400);
    }
    for(const patch of [{price:[21000]},{fees:false}]){
      assert.equal((await request(isolated,'/api/community',{method:'POST',cookie,body:newDeal(patch)})).status,400);
    }
  }finally{isolated.db.close();}
});

test('reports reject nonpublic entities and require an administrator decision with an audit reason',async()=>{
  assert.equal((await request(app,'/api/reports',{method:'POST',body:{}})).status,401);
  assert.equal((await post('/api/reports',{kind:'offer',entityId:'not-public',reason:'incorrect_price'})).status,404);
  const body={kind:'offer',entityId:'offer-travel-1',reason:'wrong_scope',detail:'Please inspect whether the declared package scope matches.'};
  const r=await post('/api/reports',body);assert.equal(r.status,201);assert.equal((await post('/api/reports',body)).data.id,r.data.id);
  assert.equal((await get('/api/moderation',buyer)).status,403);assert.equal((await get('/api/moderation')).status,401);
  const queue=(await get('/api/moderation',admin)).data.reports;assert.ok(queue.some(x=>x.id===r.data.id&&x.entityId===body.entityId&&x.status==='pending'));
  assert.equal((await post('/api/reports/'+r.data.id+'/review',{decision:'resolved',reason:'Reviewed scope with the supplied terms.'},buyer)).status,403);
  assert.equal((await post('/api/reports/'+r.data.id+'/review',{decision:'resolved',reason:'x'},admin)).status,400);
  const resolved=await post('/api/reports/'+r.data.id+'/review',{decision:'resolved',reason:'Reviewed scope with the supplied terms.'},admin);assert.equal(resolved.status,200);assert.equal(resolved.data.publicationChanged,false);
  assert.equal(app.db.prepare('SELECT status FROM offers WHERE id=?').get(body.entityId).status,'approved');assert.ok(app.db.prepare('SELECT id FROM audit WHERE entity_id=? AND action=?').get(r.data.id,'report.resolved'));
  assert.equal((await post('/api/reports/'+r.data.id+'/review',{decision:'dismissed',reason:'A second decision is not permitted.'},admin)).status,404);
});

test('administrator withdrawals remove approved publications with an atomic reasoned audit and preserve report decisions',async()=>{
  const isolated=await createApp({demoMode:true,log:{error(){}}});
  try{
    const [buyerCookie,adminCookie]=await Promise.all([login(isolated),login(isolated,'admin')]);
    const withdraw=(body,cookie=adminCookie)=>request(isolated,'/api/moderation/withdraw',{method:'POST',cookie,body});
    const publicGet=path=>request(isolated,path);
    const reason='Provider confirmed that this published scope is unavailable.';
    const dealBody={kind:'deal',entityId:'deal-2',reason};
    assert.equal((await withdraw(dealBody,'')).status,401);
    assert.equal((await withdraw(dealBody,buyerCookie)).status,403);
    assert.equal((await withdraw({...dealBody,kind:'constructor'})).status,400);
    assert.equal((await withdraw({...dealBody,reason:'short'})).status,400);
    const pending=await request(isolated,'/api/community',{method:'POST',cookie:buyerCookie,body:newDeal()});
    assert.equal(pending.status,201);
    assert.equal((await withdraw({...dealBody,entityId:pending.data.id})).status,404);

    const report=await request(isolated,'/api/reports',{method:'POST',cookie:buyerCookie,body:{kind:'deal',entityId:'deal-2',reason:'incorrect scope'}});
    assert.equal(report.status,201);
    const queue=()=>request(isolated,'/api/moderation',{cookie:adminCookie});
    assert.equal((await queue()).data.reports.find(r=>r.id===report.data.id).canWithdraw,true);
    assert.deepEqual((await withdraw(dealBody)).data,{ok:true,status:'rejected'});
    assert.equal((await publicGet('/api/community/deal-2')).status,404);
    assert.ok(!(await publicGet('/api/community?expired=include')).data.posts.some(p=>p.id==='deal-2'));
    assert.equal(isolated.db.prepare("SELECT status FROM deals WHERE id='deal-2'").get().status,'rejected');
    const retainedReport=(await queue()).data.reports.find(r=>r.id===report.data.id);
    assert.equal(retainedReport.status,'pending');assert.equal(retainedReport.publicationStatus,'rejected');assert.equal(retainedReport.canWithdraw,false);
    assert.equal((await withdraw(dealBody)).status,404);
    assert.equal(isolated.db.prepare("SELECT detail,user_id FROM audit WHERE action='deal.withdrawn' AND entity_id='deal-2'").get().detail,reason);

    const product=(await publicGet('/api/products?category=travel')).data.products[0];
    isolated.db.exec("CREATE TRIGGER reject_withdraw_audit BEFORE INSERT ON audit WHEN NEW.action='offer.withdrawn' BEGIN SELECT RAISE(ABORT,'Audit unavailable'); END;");
    assert.equal((await withdraw({kind:'offer',entityId:'offer-travel-1',reason})).status,500);
    assert.equal(isolated.db.prepare("SELECT status FROM offers WHERE id='offer-travel-1'").get().status,'approved');
    isolated.db.exec('DROP TRIGGER reject_withdraw_audit');
    for(const entityId of ['offer-travel-1','offer-travel-2','offer-travel-3']){
      assert.equal((await withdraw({kind:'offer',entityId,reason})).status,200);
      const entry=isolated.db.prepare("SELECT detail,user_id FROM audit WHERE action='offer.withdrawn' AND entity_id=?").get(entityId);
      assert.equal(entry.detail,reason);assert.equal(entry.user_id,'demo-admin');
    }
    assert.equal((await publicGet('/api/products?category=travel')).data.total,0);
    assert.equal((await publicGet('/api/products/'+product.id)).status,404);
    assert.equal(isolated.db.prepare("SELECT COUNT(*) n FROM offers WHERE category='travel' AND status='rejected'").get().n,3);
    assert.equal(isolated.db.prepare("SELECT COUNT(*) n FROM price_history WHERE offer_id LIKE 'offer-travel-%'").get().n,3);
  }finally{isolated.db.close();}
});

test('additive schema initialization is idempotent and watches with read state survive a reopen',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'savesmart-reverse-'));
  let db;
  try{
    const path=join(dir,'db.sqlite'),first=await createApp({databasePath:path,demoMode:true});db=first.db;
    initializeReverse(db);initializeReverse(db);
    const cookie=await login(first);const r=await request(first,'/api/watches',{method:'POST',cookie,body:{category:'travel'}});
    assert.equal(r.status,201);await request(first,'/api/watches/'+r.data.id+'/read',{method:'POST',cookie,body:{}});db.close();db=null;
    const reopened=await createApp({databasePath:path,demoMode:true});db=reopened.db;const c=await login(reopened);
    const watches=(await request(reopened,'/api/watches',{cookie:c})).data.watches;assert.equal(watches.length,1);assert.equal(watches[0].id,r.data.id);assert.equal(watches[0].unreadCount,0);assert.ok(watches[0].matches.length);
  }finally{db?.close();rmSync(dir,{recursive:true,force:true});}
});
