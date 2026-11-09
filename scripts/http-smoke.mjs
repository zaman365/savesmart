import assert from 'node:assert/strict';
import {createApp} from '../server/app.mjs';

const app=await createApp({demoMode:true});
try{
  await new Promise((resolve,reject)=>{app.server.once('error',reject);app.server.listen(0,'127.0.0.1',resolve);});
  const origin=`http://127.0.0.1:${app.server.address().port}`;
  async function json(path,{method='GET',cookie='',body,status=200}={}){
    const response=await fetch(origin+path,{method,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
    const data=await response.json();
    assert.equal(response.status,status,path+': '+JSON.stringify(data));
    return {data,response};
  }
  async function signIn(role){
    const {response}=await json('/api/auth/login',{method:'POST',body:{email:role+'@demo.savesmart.test',password:'DemoCompare24!'}});
    return response.headers.get('set-cookie').split(';')[0];
  }
  const home=await fetch(origin);
  assert.equal(home.status,200);
  assert.match(await home.text(),/SaveSmart/);
  for(const asset of ['/reverse.css','/reverse-client.js'])assert.equal((await fetch(origin+asset)).status,200,asset);
  const buyer=await signIn('buyer');
  assert.ok((await json('/api/plans',{cookie:buyer})).data.plans.length);
  await json('/api/compare?ids=offer-travel-1,offer-travel-2');
  assert.equal((await json('/api/discover')).data.categories.length,12);
  const products=(await json('/api/products?category=travel')).data.products;
  assert.equal(products.length,1);
  const detail=(await json('/api/products/'+products[0].id)).data;
  assert.equal(detail.offers.length,3);
  assert.ok(detail.history.length);
  const posts=(await json('/api/community?sort=latest')).data.posts;
  assert.ok(posts.length);
  const post=posts[0];
  assert.equal((await json('/api/community/'+post.id)).data.post.id,post.id);
  const positive=(await json('/api/community/'+post.id+'/vote',{method:'POST',cookie:buyer,body:{value:1}})).data;
  const negative=(await json('/api/community/'+post.id+'/vote',{method:'POST',cookie:buyer,body:{value:-1}})).data;
  assert.equal(positive.vote,1);
  assert.equal(negative.vote,-1);
  assert.equal(positive.heat-negative.heat,2);
  await json('/api/community/'+post.id+'/vote',{method:'POST',cookie:buyer,body:{value:0}});
  await json('/api/watches',{status:401});
  const watch=(await json('/api/watches',{method:'POST',cookie:buyer,status:201,body:{category:'travel',maxPrice:detail.product.lowestTotal}})).data;
  const current=(await json('/api/watches',{cookie:buyer})).data.watches.find(item=>item.id===watch.id);
  assert.ok(current.matches.length);
  assert.ok(current.matches.every(match=>match.total<=detail.product.lowestTotal));
  assert.ok(current.unreadCount);
  await json('/api/watches/'+watch.id+'/read',{method:'POST',cookie:buyer,body:{}});
  assert.equal((await json('/api/watches',{cookie:buyer})).data.watches.find(item=>item.id===watch.id).unreadCount,0);
  const coupon=(await json('/api/community',{method:'POST',cookie:buyer,status:201,body:{kind:'coupon',title:'An illustrative reviewed coupon',category:'travel',price:null,fees:0,terms:'Illustrative coupon with unknown checkout amount. Confirm source terms before use.',url:'https://example.com/coupon',code:'HTTP15',expiresAt:new Date(Date.now()+86400000).toISOString()}})).data;
  const admin=await signIn('admin');
  const pending=(await json('/api/admin',{cookie:admin})).data.deals.find(item=>item.id===coupon.id);
  assert.equal(pending.review.kind,'coupon');
  assert.equal(pending.review.has_price,0);
  assert.equal(pending.review.code,'HTTP15');
  await json('/api/watches/'+watch.id,{method:'DELETE',cookie:buyer});
  console.log('Real HTTP smoke passed: entry/assets, sessions, comparisons, canonical detail/history, community signed votes, private watches/read state and publication metadata.');
  await app.close();
}catch(error){
  if(!app.server.listening)app.db.close();else await app.close();
  throw error;
}
