import { categories } from '../data/catalogue.mjs';

export class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
export const fail=(status,message)=>{throw new HttpError(status,message);};
export function text(value,label,min=1,max=500){if(typeof value!=='string')fail(400,`${label} is required.`);const s=value.trim();if(s.length<min||s.length>max)fail(400,`${label} must contain ${min}–${max} characters.`);return s;}
export function amount(value,label='Amount',min=0,max=1000000000){const n=Number(value);if(value===''||value===null||!Number.isSafeInteger(n)||n<min||n>max)fail(400,`${label} must be a whole BDT amount between ${min} and ${max}.`);return n;}
export function category(value){if(!categories.some(c=>c.id===value))fail(400,'Choose a supported category.');return value;}
export function safeUrl(value){if(!value)return '';let u;try{u=new URL(value);}catch{fail(400,'Enter a valid link.');}if(!['https:','http:'].includes(u.protocol)||u.username||u.password)fail(400,'Only public http or https links are supported.');return u.href.slice(0,2000);}
export function futureDate(value,days=365){const d=new Date(value);if(!Number.isFinite(d.getTime())||d.getTime()<=Date.now()||d.getTime()>Date.now()+days*86400000)fail(400,`Choose an expiry within the next ${days} days.`);return d.toISOString();}
export function totalPrice(o){return Number(o.price)+Number(o.fees);}
const normalizeScope=value=>String(value).trim().toLowerCase().replace(/\s+/g,' ');
export function compareOffers(offers){if(offers.length<2||offers.length>4)fail(400,'Select between two and four offers.');const first=offers[0];if(offers.some(o=>normalizeScope(o.category)!==normalizeScope(first.category)||normalizeScope(o.comparisonGroup)!==normalizeScope(first.comparisonGroup)||normalizeScope(o.unit)!==normalizeScope(first.unit)))fail(400,'Compare offers with the same scope and price unit.');return [...offers].sort((a,b)=>totalPrice(a)-totalPrice(b));}
export function searchCategory(query){const q=query.toLocaleLowerCase().trim();if(!q)return null;return categories.find(c=>c.id===q||c.name.toLowerCase()===q||c.aliases.split(' ').includes(q))?.id??null;}
export function ownershipCost({purchasePrice,resaleValue,monthlyKm,fuelEfficiency,fuelPrice,annualMaintenance,years}){
  const purchase=amount(purchasePrice,'Purchase price',1),resale=amount(resaleValue,'Resale value');
  const km=amount(monthlyKm,'Monthly kilometers',0,50000),fuel=amount(fuelPrice,'Fuel price',1,10000),maintenance=amount(annualMaintenance,'Annual maintenance',0,10000000);
  const efficiency=Number(fuelEfficiency),period=amount(years,'Years',1,15);if(!(efficiency>=1&&efficiency<=100))fail(400,'Fuel efficiency must be between 1 and 100 km/litre.');if(resale>purchase)fail(400,'Resale value cannot exceed purchase price in this calculator.');
  const fuelCost=Math.round(km*12*period/efficiency*fuel),maintenanceCost=maintenance*period,depreciation=purchase-resale,total=fuelCost+maintenanceCost+depreciation;
  return {fuelCost,maintenanceCost,depreciation,total,monthly:Math.round(total/(period*12)),years:period,exclusions:'Financing, taxes, insurance, parking and unexpected repairs are excluded. These are your estimates, not market valuations.'};
}
