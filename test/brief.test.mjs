import test from 'node:test';
import assert from 'node:assert/strict';
import {briefRequestParams} from '../apps/web/brief.js';
import {verticals} from '../data/verticals.mjs';

test('each industry can carry its own comparison fields into a consent-review request',()=>{
 for(const [category,{schema}]of Object.entries(verticals)){
  const draft={category,title:'A request for '+category,location:'Dhaka',budget:'35000',notes:'Please show all exclusions.'};
  for(const f of schema)draft['scope:'+f.label]='Flexible requirement for '+f.key;
  const params=briefRequestParams(draft);
  assert.equal(params.get('category'),category);
  assert.equal(params.get('budget'),'35000');
  for(const f of schema)assert.ok(params.get('details').includes(f.label+': Flexible requirement for '+f.key));
  assert.match(params.get('details'),/mandatory charges/);
  assert.equal(params.has('contactConsent'),false);
  assert.equal(params.has('providerId'),false);
 }
});
test('oversized brief is rejected before the request-review handoff',()=>{
 assert.throws(()=>briefRequestParams({category:'home',title:'A home job',location:'Dhaka',budget:'1000','scope:Work':'x'.repeat(3000)}),/Shorten the brief/);
});
