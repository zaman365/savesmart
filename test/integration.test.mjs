import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server/app.mjs';
import {renderPage} from '../apps/web/pages.js';
import {briefRequestParams} from '../apps/web/brief.js';
import {e} from '../apps/web/ui.js';
import {request,login,tomorrow} from './helpers.mjs';

async function withApp(run){
  const app=await createApp({demoMode:true});
  try{await run(app);}finally{app.db.close();}
}

async function withRendering(app,cookie,run){
  const original=globalThis.fetch;
  const bootstrap=(await request(app,'/api/bootstrap',{cookie})).data;
  const state={...bootstrap,lang:'en',location:'Dhaka'};
  globalThis.fetch=async(path,options={})=>{
    const response=await request(app,path,{method:options.method??'GET',cookie,body:options.body?JSON.parse(options.body):undefined});
    return {ok:response.status>=200&&response.status<300,status:response.status,json:async()=>response.data};
  };
  try{await run(state);}finally{globalThis.fetch=original;}
}

const submission=patch=>({kind:'deal',title:'A clear complete trip offer',category:'travel',price:18000,fees:750,terms:'Two guests, three nights, with the listed transfer charges. Confirm exact dates before purchase.',url:'https://example.com/trip',expiresAt:tomorrow(),...patch});

test('comparison rejects matching seller labels across different industries',async()=>withApp(async app=>{
  const travel=app.db.prepare("SELECT comparison_group,unit FROM offers WHERE id='offer-travel-1'").get();
  app.db.prepare("UPDATE offers SET comparison_group=?,unit=? WHERE id='offer-automotive-1'").run(travel.comparison_group,travel.unit);
  const response=await request(app,'/api/compare?ids=offer-travel-1,offer-automotive-1');
  assert.equal(response.status,400);
  assert.match(response.data.error,/same scope and price unit/);
}));

test('canonical detail and comparison accept the same normalized scope and unit',async()=>withApp(async app=>{
  const first=app.db.prepare("SELECT comparison_group,unit FROM offers WHERE id='offer-travel-1'").get();
  app.db.prepare("UPDATE offers SET comparison_group=?,unit=? WHERE id='offer-travel-2'").run('  '+first.comparison_group.toUpperCase()+'  ','  '+first.unit.toUpperCase().replace(/ /g,'   ')+'  ');
  const results=await request(app,'/api/products?category=travel');
  assert.equal(results.status,200);
  assert.equal(results.data.total,1);
  assert.equal(results.data.products[0].offerCount,3);
  const detail=await request(app,'/api/products/'+results.data.products[0].id);
  assert.equal(detail.status,200);
  assert.ok(detail.data.offers.some(offer=>offer.id==='offer-travel-2'));
  const response=await request(app,'/api/compare?ids=offer-travel-1,offer-travel-2');
  assert.equal(response.status,200);
  assert.equal(response.data.offers.length,2);
  assert.ok(response.data.offers[0].total<=response.data.offers[1].total);
}));

test('publication review exposes coupon uncertainty and supplier disclosure before approval',async()=>withApp(async app=>{
  const merchant=await login(app,'merchant'),admin=await login(app,'admin');
  const coupon=await request(app,'/api/community',{method:'POST',cookie:merchant,body:submission({kind:'coupon',origin:'community',price:null,fees:0,code:'CLEAR15',disclosure:'I operate the supplier and this promotion is my commercial offer.',payment:'Visa card holders',location:'Dhaka'})});
  assert.equal(coupon.status,201);
  const deal=await request(app,'/api/community',{method:'POST',cookie:merchant,body:submission({disclosure:'I operate the supplier; the mandatory transfer charge is included.'})});
  assert.equal(deal.status,201);
  assert.equal((await request(app,'/api/admin')).status,401);
  assert.equal((await request(app,'/api/admin',{cookie:merchant})).status,403);
  const response=await request(app,'/api/admin',{cookie:admin});
  assert.equal(response.status,200);
  const pendingCoupon=response.data.deals.find(post=>post.id===coupon.data.id),pendingDeal=response.data.deals.find(post=>post.id===deal.data.id);
  assert.equal(pendingCoupon.review.kind,'coupon');
  assert.equal(pendingCoupon.review.code,'CLEAR15');
  assert.equal(pendingCoupon.review.has_price,0);
  assert.equal(pendingCoupon.review.origin,'merchant');
  assert.equal(pendingCoupon.review.owns_business,1);
  assert.match(pendingCoupon.review.disclosure,/commercial offer/);
  assert.equal(pendingCoupon.review.payment,'Visa card holders');
  assert.equal(pendingCoupon.review.location,'Dhaka');
  assert.ok(new Date(pendingCoupon.expires_at).getTime()>Date.now());
  assert.equal(pendingDeal.review.fees,750);
  assert.equal(pendingDeal.review.has_price,1);
  await withRendering(app,admin,async state=>{
    const html=await renderPage('/admin',new URLSearchParams(),state);
    for(const text of ['No checkout price supplied','Commercial disclosure','CLEAR15','Visa card holders','commercial offer','Mandatory fees'])assert.ok(html.includes(text),text);
  });
}));

test('discussion review does not present an invented checkout price or expiry',async()=>withApp(async app=>{
  const buyer=await login(app),admin=await login(app,'admin');
  const created=await request(app,'/api/community',{method:'POST',cookie:buyer,body:submission({kind:'discussion',price:null,expiresAt:null,title:'Which inspection questions should I ask?'})});
  assert.equal(created.status,201);
  const record=(await request(app,'/api/admin',{cookie:admin})).data.deals.find(post=>post.id===created.data.id);
  assert.equal(record.review.kind,'discussion');
  assert.equal(record.review.has_price,0);
  assert.equal(record.review.no_expiry,1);
  await withRendering(app,admin,async state=>{
    const html=await renderPage('/admin',new URLSearchParams(),state);
    assert.match(html,/No expiry \(discussion\)/);
    assert.doesNotMatch(html,/9999/);
  });
}));

test('merchant-offer detail provides the report control connected to that offer',async()=>withApp(async app=>{
  await withRendering(app,'',async state=>{
    const html=await renderPage('/offer/offer-travel-1',new URLSearchParams(),state);
    assert.match(html,/<button[^>]*data-r-report="offer-travel-1"[^>]*data-r-kind="offer"[^>]*>Report an issue with this offer<\/button>/);
  });
}));

test('home uses current comparison/community data and links all three engines',async()=>withApp(async app=>{
  const discover=(await request(app,'/api/discover')).data;
  const products=(await request(app,'/api/products?sort=merchants')).data.products;
  const posts=(await request(app,'/api/community?sort=latest')).data.posts;
  await withRendering(app,'',async state=>{
    const html=await renderPage('/',new URLSearchParams(),state);
    assert.match(html,/<form data-r-form="products"/);
    for(const route of ['/products','/community','/ask','/watches','/discover','/guides','/partners','/travel','/automotive'])assert.ok(html.includes('href="#'+route+'"'),route);
    for(const category of discover.categories)assert.ok(html.includes('href="#/sector/'+category.id+'"'),category.id);
    assert.ok(html.includes('href="#/product/'+products[0].id+'"'));
    assert.ok(html.includes('href="#/deal/'+posts[0].id+'"'));
    assert.ok(html.includes('<dd>'+discover.coverage.offerCount+'</dd>'));
    assert.doesNotMatch(html,/\bundefined\b|\[object Object\]/);
  });
}));

test('all twelve sector briefs render their actual schema and hand off to a consented request review',async()=>withApp(async app=>{
  const buyer=await login(app),categories=(await request(app,'/api/discover')).data.categories;
  const initialRequests=app.db.prepare('SELECT COUNT(*) count FROM requests').get().count;
  await withRendering(app,buyer,async state=>{
    for(const category of categories){
      const {schema}= (await request(app,'/api/sectors/'+category.id)).data;
      const html=await renderPage('/brief/'+category.id,new URLSearchParams(),state);
      assert.match(html,/<form[^>]*data-form="sector-brief"/);
      assert.ok(html.includes('name="category" value="'+category.id+'"'));
      for(const field of schema)assert.ok(html.includes('name="scope:'+e(field.label)+'"'),category.id+': '+field.label);
      const answers=Object.fromEntries(schema.map(field=>['scope:'+field.label,'Example requirements for '+field.label]));
      const params=briefRequestParams({category:category.id,title:'A clearly scoped '+category.name+' request',location:'Dhaka',budget:'60000',notes:'Please quote all mandatory charges.',...answers});
      const review=await renderPage('/ask',params,state);
      assert.ok(review.includes('value="A clearly scoped '+e(category.name)+' request"'));
      assert.match(review,/name="contactConsent" required/);
      assert.match(review,/Please quote all mandatory charges/);
      assert.doesNotMatch(html,/\bundefined\b|\[object Object\]/);
    }
  });
  assert.equal(app.db.prepare('SELECT COUNT(*) count FROM requests').get().count,initialRequests,'Draft and review rendering must not send a request.');
}));
