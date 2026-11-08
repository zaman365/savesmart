import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {sampleCatalogue} from '../data/catalogue.mjs';
export const id=prefix=>`${prefix}-${randomUUID()}`;
export const now=()=>new Date().toISOString();

export function openDatabase(path=':memory:') {
  if(path!==':memory:')mkdirSync(dirname(path),{recursive:true,mode:0o700});
  const db=new DatabaseSync(path);db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  if(path!==':memory:')db.exec('PRAGMA journal_mode=WAL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'consumer' CHECK(role IN ('consumer','admin')),created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS businesses(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,category TEXT NOT NULL,location TEXT NOT NULL,description TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),response_hours INTEGER NOT NULL DEFAULT 24,is_sample INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS offers(id TEXT PRIMARY KEY,business_id TEXT NOT NULL REFERENCES businesses(id),category TEXT NOT NULL,title TEXT NOT NULL,comparison_group TEXT NOT NULL,unit TEXT NOT NULL,location TEXT NOT NULL,price INTEGER NOT NULL CHECK(price>=0),fees INTEGER NOT NULL DEFAULT 0 CHECK(fees>=0),rebate INTEGER NOT NULL DEFAULT 0 CHECK(rebate>=0),payment TEXT NOT NULL DEFAULT 'Any',attributes TEXT NOT NULL DEFAULT '{}',art TEXT NOT NULL DEFAULT 'home',status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),is_sample INTEGER NOT NULL DEFAULT 0,confirmed_at TEXT NOT NULL,expires_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS price_history(id TEXT PRIMARY KEY,offer_id TEXT NOT NULL REFERENCES offers(id),total INTEGER NOT NULL,recorded_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS plans(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,kind TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS plan_items(plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,offer_id TEXT NOT NULL REFERENCES offers(id),created_at TEXT NOT NULL,PRIMARY KEY(plan_id,offer_id));
    CREATE TABLE IF NOT EXISTS alerts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,offer_id TEXT NOT NULL REFERENCES offers(id),target_price INTEGER NOT NULL CHECK(target_price>=0),created_at TEXT NOT NULL,UNIQUE(user_id,offer_id));
    CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),category TEXT NOT NULL,title TEXT NOT NULL,details TEXT NOT NULL,location TEXT NOT NULL,budget INTEGER NOT NULL,contact_consent INTEGER NOT NULL CHECK(contact_consent=1),status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','unmatched','selected','cancelled')),selected_quote_id TEXT,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS assignments(request_id TEXT NOT NULL REFERENCES requests(id),business_id TEXT NOT NULL REFERENCES businesses(id),PRIMARY KEY(request_id,business_id));
    CREATE TABLE IF NOT EXISTS quotes(id TEXT PRIMARY KEY,request_id TEXT NOT NULL REFERENCES requests(id),business_id TEXT NOT NULL REFERENCES businesses(id),amount INTEGER NOT NULL CHECK(amount>0),inclusions TEXT NOT NULL,terms TEXT NOT NULL,expires_at TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'offered' CHECK(status IN ('offered','accepted','declined')),created_at TEXT NOT NULL,UNIQUE(request_id,business_id));
    CREATE TABLE IF NOT EXISTS deals(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),title TEXT NOT NULL,category TEXT NOT NULL,price INTEGER NOT NULL,terms TEXT NOT NULL,url TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),is_sample INTEGER NOT NULL DEFAULT 0,expires_at TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS votes(deal_id TEXT NOT NULL REFERENCES deals(id),user_id TEXT NOT NULL REFERENCES users(id),PRIMARY KEY(deal_id,user_id));
    CREATE TABLE IF NOT EXISTS comments(id TEXT PRIMARY KEY,deal_id TEXT NOT NULL REFERENCES deals(id),user_id TEXT NOT NULL REFERENCES users(id),body TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),action TEXT NOT NULL,entity_id TEXT NOT NULL,detail TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS offers_public ON offers(status,category,comparison_group);
    CREATE INDEX IF NOT EXISTS requests_owner ON requests(user_id,created_at);
    CREATE INDEX IF NOT EXISTS businesses_owner ON businesses(owner_id);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
  `);
  db.prepare('INSERT OR IGNORE INTO migrations VALUES(1,?)').run(now());
  return db;
}
export function transaction(db,fn){db.exec('BEGIN IMMEDIATE');try{const r=fn();db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}
export function audit(db,user,action,entity,detail=''){db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?)').run(id('audit'),user?.id??null,action,entity,detail,now());}
export function offerJSON(o){return {id:o.id,businessId:o.business_id,merchant:o.merchant,category:o.category,title:o.title,comparisonGroup:o.comparison_group,unit:o.unit,location:o.location,price:o.price,fees:o.fees,total:o.price+o.fees,rebate:o.rebate,payment:o.payment,attributes:JSON.parse(o.attributes),art:o.art,status:o.status,isSample:Boolean(o.is_sample),confirmedAt:o.confirmed_at,expiresAt:o.expires_at};}
export const publicOfferSQL=`SELECT o.*,b.name merchant FROM offers o JOIN businesses b ON b.id=o.business_id WHERE o.status='approved' AND b.status='approved' AND o.expires_at>?`;

export async function seedDemo(db,hashPassword){
  if(db.prepare('SELECT id FROM users LIMIT 1').get())return;
  const hash=await hashPassword('DemoCompare24!'),at=now();
  transaction(db,()=>{
    for(const [uid,name,email,role]of [['demo-buyer','Demo Buyer','buyer@demo.savesmart.test','consumer'],['demo-merchant','Demo Merchant','merchant@demo.savesmart.test','consumer'],['demo-other','Other Supplier','other@demo.savesmart.test','consumer'],['demo-admin','Demo Reviewer','admin@demo.savesmart.test','admin']])db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(uid,name,email,hash,role,at);
    const {businesses,offers}=sampleCatalogue();
    for(const b of businesses)db.prepare('INSERT INTO businesses VALUES(?,?,?,?,?,?,?, ?,1,?)').run(b.id,b.ownerId,b.name,b.category,b.location,b.description,'approved',b.responseHours,at);
    for(const o of offers){db.prepare('INSERT INTO offers VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(o.id,o.businessId,o.category,o.title,o.comparisonGroup,o.unit,o.location,o.price,o.fees,o.rebate,o.payment,JSON.stringify(o.attributes),o.art,'approved',1,o.confirmedAt,o.expiresAt);
      db.prepare('INSERT INTO price_history VALUES(?,?,?,?)').run(id('price'),o.id,o.price+o.fees,at);
    }
    db.prepare('INSERT INTO plans VALUES(?,?,?,?,?)').run('demo-plan','demo-buyer','Our next little escape','travel',at);
    db.prepare('INSERT INTO plan_items VALUES(?,?,?)').run('demo-plan','offer-travel-1',at);
    for(const [did,title,cat,price,terms]of [['deal-1','A quieter weekend by the coast','travel',25000,'Illustrative family-trip deal. Dates, rooms and transport must be confirmed.'],['deal-2','A proper AC clean before the heat','home',1200,'Illustrative one-unit service. Parts are extra.'],['deal-3','A family dinner, with the extras clear','dining',2200,'Illustrative four-person set menu. Check menu and service charge.']])db.prepare('INSERT INTO deals VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(did,'demo-buyer',title,cat,price,terms,'','approved',1,new Date(Date.now()+30*86400000).toISOString(),at);
  });
}
