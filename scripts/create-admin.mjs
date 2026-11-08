import {openDatabase,id,now} from '../server/db.mjs';
import {hashPassword} from '../server/auth.mjs';
import {resolve} from 'node:path';
const email=process.env.ADMIN_EMAIL?.trim().toLowerCase(),password=process.env.ADMIN_PASSWORD,name=process.env.ADMIN_NAME??'SaveSmart Administrator';
if(!email||!password)throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment. Never commit them.');
const db=openDatabase(resolve(process.env.DATABASE_PATH??'var/savesmart.sqlite'));
try{if(db.prepare('SELECT id FROM users WHERE email=?').get(email))throw new Error('This email already exists. Provision a new administrator email.');db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(id('user'),name,email,await hashPassword(password),'admin',now());console.log('Administrator created. No password has been printed.');}finally{db.close();}
