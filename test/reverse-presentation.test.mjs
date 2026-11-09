import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server/app.mjs';
import {renderPage} from '../apps/web/pages.js';
import {previewPostHTML} from '../apps/web/reverse-client.js';
import {request,login,tomorrow} from './helpers.mjs';

// Render the browser's real route dispatcher against the actual request listener,
// including authentication and SQLite queries, without requiring a bound port.
let app,cookie,state,buyer,merchant,admin,scope,postId,couponId,discussionId,legacyId;
const originalFetch=globalThis.fetch;
const hostile='<img src=x onerror="alert(1)">';
const get=(path,session=cookie)=>request(app,path,{cookie:session});
const post=(path,body,session=cookie)=>request(app,path,{method:'POST',cookie:session,body});
const render=(path,query='',viewState=state)=>renderPage(path,new URLSearchParams(query),viewState);
async function session(sessionCookie){
 cookie=sessionCookie;
 const response=await get('/api/bootstrap');
 assert.equal(response.status,200);
 state={...response.data,lang:'en',location:'Dhaka'};
}
async function publish(body){
 const submitted=await post('/api/community',body,buyer);
 assert.equal(submitted.status,201,JSON.stringify(submitted.data));
 const approved=await post('/api/admin/review',{kind:'deal',id:submitted.data.id,decision:'approved',reason:'Reviewed source, price, scope and contributor details.'},admin);
 assert.equal(approved.status,200,JSON.stringify(approved.data));
 return submitted.data.id;
}

before(async()=>{
 app=await createApp({demoMode:true});
 [buyer,merchant,admin]=await Promise.all(['buyer','merchant','admin'].map(role=>login(app,role)));
 await session(buyer);
 globalThis.fetch=async(path,options={})=>{
  const result=await request(app,path,{method:options.method??'GET',cookie,body:options.body?JSON.parse(options.body):undefined});
  return {ok:result.status>=200&&result.status<300,status:result.status,json:async()=>result.data};
 };
 scope=(await get('/api/products?category=travel')).data.products[0];
 postId=await publish({kind:'deal',category:'travel',title:'Family trip '+hostile,terms:'All inclusions and mandatory charges are listed. Literal user text: '+hostile,price:21000,fees:1000,url:'https://example.com/family-trip',expiresAt:tomorrow(),comparisonGroup:'cox-family-3n'});
 couponId=await publish({kind:'coupon',category:'dining',title:'A conditional family dining coupon',terms:'The final price depends on your order. Confirm eligible dates and payment terms.',price:null,fees:0,code:'FAMILY10',url:'https://example.com/coupon',expiresAt:tomorrow()});
 discussionId=await publish({kind:'discussion',category:'automotive',title:'Which car ownership costs should a family compare?',terms:'Compare fuel, maintenance, insurance and the assumptions behind resale value.'});
 const legacy=await post('/api/deals',{title:'Legacy fee presentation record',category:'home',price:1000,terms:'This historical post records one price but has no separate mandatory-fee declaration.',expiresAt:tomorrow()});
 assert.equal(legacy.status,201);legacyId=legacy.data.id;
 assert.equal((await post('/api/admin/review',{kind:'deal',id:legacyId,decision:'approved',reason:'Historical record retained with its price basis disclosed.'},admin)).status,200);
 assert.equal((await post('/api/community/'+postId+'/comments',{body:'Please confirm the travel dates. '+hostile})).status,201);
});
after(()=>{globalThis.fetch=originalFetch;app?.db.close();});

test('all new public workspaces and twelve industry and guide pages render actual API records',async()=>{
 const paths=['/discover','/products','/product/'+scope.id,'/community','/community/submit','/deal/'+postId,'/deal/'+couponId,'/deal/'+discussionId,'/watches','/guides','/how-we-compare','/partners','/moderation',...state.categories.flatMap(c=>['/sector/'+c.id,'/guide/'+c.id+'-decisions'])];
 for(const path of paths){
  const html=await render(path);
  assert.ok(typeof html==='string'&&html.length>500,path);
  assert.doesNotMatch(html,/\bundefined\b|\[object Object\]|Invalid Date|\bNaN\b/,path);
  assert.match(html,/class="r-workspace|class="container r-workspace/,path);
  if(path.startsWith('/sector/'))assert.match(html,new RegExp('href="#/brief/'+path.slice(8)+'"'),path);
 }
});

test('canonical results consolidate sellers and retain total-cost and attribute distinctions',async()=>{
 const results=await render('/products','category=travel');
 assert.equal((results.match(/class="r-product-row"/g)??[]).length,1);
 assert.match(results,/3 providers/);
 const html=await render('/product/'+scope.id);
 const detail=(await get('/api/products/'+scope.id)).data;
 const ids=[...html.matchAll(/data-save="([^"]+)"/g)].map(match=>match[1]);
 assert.deepEqual(ids,detail.offers.map(o=>o.id));
 assert.match(html,/conditional .*rebate/);
 assert.match(html,/<tr data-r-same="(?:true|false)"><th scope="row">Total payable<\/th>/);
 assert.match(html,/<tr data-r-same="(?:true|false)"><th scope="row">Price unit<\/th>/);
 assert.match(html,/<tr data-comparison-attribute data-r-same="false"><th scope="row">Option<\/th>/);
 assert.match(html,/Illustrative comparison scope/);
 assert.match(html,/Recorded observations/);
 assert.doesNotMatch(html,/90.day history|verified saving|market.low chart/i);
});

test('community type filters, conditional coupons and price-free discussions have distinct presentations',async()=>{
 const filtered=await render('/community','category=automotive&kind=discussion&sort=discussed');
 assert.match(filtered,/option value="discussion" selected/);
 assert.match(filtered,/option value="automotive" selected/);
 assert.match(filtered,/community\?category=automotive&amp;kind=discussion&amp;sort=latest/);
 assert.match(filtered,/Which car ownership costs/);
 assert.doesNotMatch(filtered,/A conditional family dining coupon/);
 const coupon=await render('/deal/'+couponId);
 assert.match(coupon,/A conditional promotion/);
 assert.match(coupon,/data-r-copy-code="FAMILY10"/);
 assert.doesNotMatch(coupon,/Complete listed price|<strong>৳0<\/strong>/);
 const discussion=await render('/deal/'+discussionId);
 assert.match(discussion,/A question for the community/);
 assert.doesNotMatch(discussion,/Complete listed price|<dt>Ends<\/dt>|<strong>৳0<\/strong>/);
});

test('provider attributes named after inherited properties leave absent seller values visibly missing',async()=>{
 const original=app.db.prepare("SELECT attributes FROM offers WHERE id='offer-travel-1'").get().attributes;
 try{
  const attributes=JSON.parse(original);
  Object.defineProperty(attributes,'__proto__',{value:'Provider-defined special condition',enumerable:true});
  app.db.prepare("UPDATE offers SET attributes=? WHERE id='offer-travel-1'").run(JSON.stringify(attributes));
  const html=await render('/product/'+scope.id);
  assert.match(html,/<th scope="row">__proto__<\/th><td>Provider-defined special condition<\/td><td>Not supplied<\/td><td>Not supplied<\/td>/);
  assert.doesNotMatch(html,/\[object Object\]|function Object/);
 }finally{app.db.prepare("UPDATE offers SET attributes=? WHERE id='offer-travel-1'").run(original);}
});

test('community detail escapes submitted text and rejects unsafe historical source URLs',async()=>{
 app.db.prepare('UPDATE deals SET url=? WHERE id=?').run('javascript:alert(1)',postId);
 try{
  const html=await render('/deal/'+postId);
  assert.doesNotMatch(html,/<img src=x|href="javascript:|onerror="alert/);
  assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(html,/No external source link was supplied/);
  assert.match(html,/Please confirm the travel dates/);
  assert.match(html,/Inspect the provider comparison/);
  assert.match(html,/data-r-form="comment"/);
  assert.match(html,/No unsupported saving percentage/);
 }finally{app.db.prepare('UPDATE deals SET url=? WHERE id=?').run('https://example.com/family-trip',postId);}
});

test('legacy prices with undeclared fees remain visibly incomplete in feed, detail and watch matches',async()=>{
 const html=await render('/deal/'+legacyId);
 assert.match(html,/>Listed price<\/span>/);
 assert.match(html,/<dt>Mandatory fees<\/dt><dd>Not declared<\/dd>/);
 assert.match(html,/mandatory fees were not declared/i);
 assert.doesNotMatch(html,/Complete listed price|including listed fees/);
 const feed=await render('/community','q=Legacy+fee+presentation');
 assert.match(feed,/Listed price/);
 assert.match(feed,/mandatory fees were not declared/i);
 const watch=await post('/api/watches',{query:'Legacy fee presentation',category:'home'});
 assert.equal(watch.status,201);
 const matches=await render('/watches');
 assert.match(matches,/Listed price/);
 assert.match(matches,/mandatory fees were not declared/i);
 assert.equal((await request(app,'/api/watches/'+watch.data.id,{method:'DELETE',cookie:buyer})).status,200);
});

test('expired detail remains readable while its comment and vote actions are disabled',async()=>{
 const expiry=app.db.prepare('SELECT expires_at FROM deals WHERE id=?').get(couponId).expires_at;
 app.db.prepare('UPDATE deals SET expires_at=? WHERE id=?').run('2000-01-01',couponId);
 try{
  const html=await render('/deal/'+couponId);
  assert.match(html,/Expired\. Confirm any replacement offer independently/);
  assert.match(html,/<button disabled class="" data-r-vote/);
  assert.doesNotMatch(html,/data-r-form="comment"|View the source/);
  assert.match(html,/data-r-report=/);
  assert.doesNotMatch(await render('/community','category=dining'),/A conditional family dining coupon/);
  assert.match(await render('/community','category=dining&expired=1'),/A conditional family dining coupon/);
 }finally{app.db.prepare('UPDATE deals SET expires_at=? WHERE id=?').run(expiry,couponId);}
});

test('composer presents contributor origins from actual account ownership and protects signed-out routes',async()=>{
 const independent=await render('/community/submit');
 assert.match(independent,/option value="community"/);
 assert.match(independent,/data-r-form="compose"/);
 assert.match(independent,/data-r-preview/);
 await session(merchant);
 const commercial=await render('/community/submit');
 assert.match(commercial,/option value="merchant">Business account contribution/);
 assert.doesNotMatch(commercial,/option value="community"/);
 assert.match(commercial,/<textarea name="disclosure" required/);
 await session(admin);
 assert.match(await render('/community/submit'),/option value="editorial"/);
 await session('');
 assert.doesNotMatch(await render('/community/submit'),/data-r-form="compose"/);
 assert.doesNotMatch(await render('/watches'),/data-r-form="watch"/);
 assert.match(await render('/watches'),/Sign in to keep your searches/);
 await session(buyer);
});

test('watch presentation consumes persisted matching items, read state and server-owned removal IDs',async()=>{
 const created=await post('/api/watches',{category:'home',query:'',maxPrice:1400});
 assert.equal(created.status,201);
 const watch=(await get('/api/watches')).data.watches.find(w=>w.id===created.data.id);
 assert.ok(watch.matches.length>0);
 assert.ok(watch.matches.every(m=>m.total<=1400&&m.feesDeclared!==false));
 let html=await render('/watches');
 assert.match(html,/data-r-delete-watch="watch-/);
 assert.match(html,new RegExp('data-r-read-watch="'+created.data.id+'"'));
 assert.match(html,new RegExp(watch.unreadCount+' unread'));
 assert.match(html,/href="#\/product\/scope-/);
 assert.match(html,/New match/);
 assert.equal((await post('/api/watches/'+created.data.id+'/read',{})).status,200);
 html=await render('/watches');
 assert.match(html,/0 unread/);
 assert.doesNotMatch(html,/class="r-unread"/);
 assert.equal((await request(app,'/api/watches/'+created.data.id,{method:'DELETE',cookie:buyer})).status,200);
 assert.doesNotMatch(await render('/watches'),new RegExp(created.data.id));
});

test('report moderation consumes protected queue records and escapes report and decision text',async()=>{
 const report=await post('/api/reports',{kind:'deal',entityId:postId,reason:'incorrect_price',detail:'Please review these supplied terms: '+hostile});
 assert.equal(report.status,201);
 assert.doesNotMatch(await render('/moderation'),/data-r-review=/);
 await session(admin);
 let html=await render('/moderation');
 assert.match(html,new RegExp('data-r-review="'+report.data.id+'"'));
 assert.match(html,/&lt;img src=x/);
 assert.doesNotMatch(html,/<img src=x/);
 const reviewed=await post('/api/reports/'+report.data.id+'/review',{decision:'resolved',reason:'Checked and recorded the supplied evidence. '+hostile});
 assert.equal(reviewed.status,200);
 html=await render('/moderation');
 assert.match(html,/Decision reason/);
 assert.match(html,/Checked and recorded the supplied evidence/);
 assert.doesNotMatch(html,/<img src=x/);
 assert.doesNotMatch(html,new RegExp('data-r-review="'+report.data.id+'"'));
 assert.match(html,new RegExp('data-r-withdraw="'+postId+'"'));
 assert.equal((await post('/api/moderation/withdraw',{kind:'deal',entityId:postId,reason:'Withdrawn after examining the source and complete price evidence.'})).status,200);
 html=await render('/moderation');
 assert.doesNotMatch(html,new RegExp('data-r-withdraw="'+postId+'"'));
 assert.match(html,/Decision reason/);
 await assert.rejects(render('/deal/'+postId),/Published post not found/);
 await session(buyer);
});

test('preview escapes every submitted field and never invents a payable price for incomplete coupons',()=>{
 const html=previewPostHTML({kind:'coupon',title:hostile,category:hostile,origin:hostile,price:null,fees:0,terms:hostile,code:hostile,location:hostile,payment:hostile,disclosure:hostile});
 assert.doesNotMatch(html,/<img src=x|onerror="alert/);
 assert.match(html,/No complete payable total is supplied/);
 assert.doesNotMatch(html,/r-preview-total/);
 assert.match(html,/Preview only/);
 const discussion=previewPostHTML({kind:'discussion',title:'A useful question',terms:'A full description of the question.',price:null,fees:0});
 assert.doesNotMatch(discussion,/r-preview-total|৳0/);
});

test('invalid public records and filters preserve useful API errors in the route renderer',async()=>{
 await assert.rejects(render('/product/not-a-current-scope'),/no current approved offers/);
 await assert.rejects(render('/sector/unknown-industry'),/Industry not found/);
 await assert.rejects(render('/products','sort=imaginary'),/supported product sort/);
 await assert.rejects(render('/deal/not-a-post'),/Published post not found/);
});
