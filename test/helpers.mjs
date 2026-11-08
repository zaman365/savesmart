import {Readable} from 'node:stream';
// Exercise the actual HTTP request listener without binding a socket. This also
// runs inside restricted Codex environments; http-smoke.mjs tests a real listener.
export async function request(app,path,{method='GET',body,cookie='',origin='http://127.0.0.1:3000',headers={}}={}) {
 const req=Readable.from(body===undefined?[]:[JSON.stringify(body)]);req.method=method;req.url=path;req.headers={host:'127.0.0.1:3000',origin,'content-type':'application/json',cookie,...headers};req.socket={remoteAddress:'127.0.0.1'};
 return new Promise((resolve,reject)=>{const responseHeaders={};const res={headersSent:false,statusCode:200,setHeader(k,v){responseHeaders[k.toLowerCase()]=v;},writeHead(status,extra={}){this.statusCode=status;for(const [k,v]of Object.entries(extra))this.setHeader(k,v);this.headersSent=true;},end(payload=''){let data;const raw=String(payload);try{data=JSON.parse(raw);}catch{data=raw;}resolve({status:this.statusCode,data,headers:responseHeaders,cookie:responseHeaders['set-cookie']?.split(';')[0]});}};try{app.server.emit('request',req,res);}catch(e){reject(e);}});
}
export async function login(app,role='buyer'){const r=await request(app,'/api/auth/login',{method:'POST',body:{email:`${role}@demo.savesmart.test`,password:'DemoCompare24!'}});if(r.status!==200)throw new Error(JSON.stringify(r));return r.cookie;}
export const tomorrow=()=>new Date(Date.now()+86400000).toISOString();
