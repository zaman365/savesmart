import {DatabaseSync,backup} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const source=resolve(process.env.DATABASE_PATH??'var/savesmart.sqlite'),destination=resolve(process.argv[2]??`var/backups/savesmart-${new Date().toISOString().replace(/[:.]/g,'-')}.sqlite`);
if(source===destination)throw new Error('Backup destination must differ from the source.');mkdirSync(dirname(destination),{recursive:true,mode:0o700});const db=new DatabaseSync(source,{readOnly:true});try{await backup(db,destination);console.log(`Backup created: ${destination}`);}finally{db.close();}
