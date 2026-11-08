import test from 'node:test';
import assert from 'node:assert/strict';
import {totalPrice,compareOffers,ownershipCost,searchCategory,amount,safeUrl,futureDate} from '../server/domain.mjs';
import {hashPassword,verifyPassword} from '../server/auth.mjs';

test('payable total includes fees and never subtracts conditional cashback',()=>assert.equal(totalPrice({price:1000,fees:120,rebate:500}),1120));
test('comparisons reject a different scope or unit',()=>{const o={price:100,fees:10,comparisonGroup:'one',unit:'night'};assert.throws(()=>compareOffers([o,{...o,comparisonGroup:'two'}]),/same scope/);assert.throws(()=>compareOffers([o,{...o,unit:'month'}]),/same scope/);});
test('comparable offers sort by full price rather than base price',()=>{const list=compareOffers([{id:'a',price:100,fees:90,comparisonGroup:'x',unit:'job'},{id:'b',price:150,fees:10,comparisonGroup:'x',unit:'job'}]);assert.equal(list[0].id,'b');});
test('ownership estimate separates depreciation, fuel and maintenance',()=>{const r=ownershipCost({purchasePrice:2600000,resaleValue:2200000,monthlyKm:1000,fuelEfficiency:16,fuelPrice:130,annualMaintenance:25000,years:3});assert.deepEqual([r.depreciation,r.fuelCost,r.maintenanceCost,r.total,r.monthly],[400000,292500,75000,767500,21319]);});
test('ownership calculator rejects zero efficiency and impossible resale assumptions',()=>{const b={purchasePrice:100,resaleValue:50,monthlyKm:1,fuelEfficiency:0,fuelPrice:1,annualMaintenance:1,years:1};assert.throws(()=>ownershipCost(b),/Fuel efficiency/);assert.throws(()=>ownershipCost({...b,fuelEfficiency:10,resaleValue:101}),/Resale/);});
test('Bangla and Banglish categories resolve deterministically',()=>{assert.equal(searchCategory('গাড়ি'),'automotive');assert.equal(searchCategory('gari'),'automotive');assert.equal(searchCategory('ভ্রমণ'),'travel');});
test('money is bounded integer arithmetic',()=>{assert.throws(()=>amount(1.25),/whole BDT/);assert.throws(()=>amount(-1),/whole BDT/);assert.throws(()=>amount(''),/whole BDT/);});
test('community source links reject script and credential URLs',()=>{assert.throws(()=>safeUrl('javascript:alert(1)'),/http/);assert.throws(()=>safeUrl('https://user:pass@example.com'),/http/);assert.equal(safeUrl('https://example.com/path'),'https://example.com/path');});
test('expiry must be in the future and within the allowed horizon',()=>{assert.throws(()=>futureDate('2000-01-01'),/expiry/);assert.throws(()=>futureDate('not-a-date'),/expiry/);});
test('passwords are salted and wrong passwords fail verification',async()=>{const a=await hashPassword('A-unique-password-24!'),b=await hashPassword('A-unique-password-24!');assert.notEqual(a,b);assert.equal(await verifyPassword('A-unique-password-24!',a),true);assert.equal(await verifyPassword('Wrong-password-24!',a),false);});
