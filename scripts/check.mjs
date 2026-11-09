import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const files=[];
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const p=join(dir,item.name);if(item.isDirectory())await walk(p);else files.push(p);}}
for(const dir of ['server','apps','data','scripts','test'])await walk(dir);
for(const file of files.filter(f=>/\.(mjs|js)$/.test(f))){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status!==0){process.stderr.write(r.stderr);process.exit(1);}}
for(const file of ['package.json','apps/web/manifest.webmanifest'])JSON.parse(await readFile(file,'utf8'));
const html=await readFile('apps/web/index.html','utf8');for(const [,asset]of html.matchAll(/(?:src|href)="(\/(?!\/)[^"#]+)"/g)){await readFile('apps/web'+asset);}
for(const file of files.filter(f=>f.startsWith('apps/'))){const source=await readFile(file,'utf8');if(/https?:\/\/(?:fonts\.|cdn\.|unpkg\.|cdnjs\.|api\.openai)/.test(source))throw new Error('External runtime dependency in '+file);}
console.log(`Checked ${files.filter(f=>/\.(mjs|js)$/.test(f)).length} JavaScript modules, manifests, entry assets and required service independence.`);
