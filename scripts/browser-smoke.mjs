// Dependency-free native-browser acceptance smoke for permitted local/CI hosts.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {createApp} from '../server/app.mjs';

const chromeBin=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chromeBin)throw new Error('Chrome/Chromium is required for browser-smoke. Set CHROME_BIN to its executable. No browser is downloaded automatically.');
const profile=await mkdtemp(join(tmpdir(),'savesmart-browser-'));
const artifacts=resolve('artifacts/browser');
let app,chrome,socket,stderr='',session,serial=0;
const pending=new Map(),browserErrors=[];
async function until(check,label,timeout=15000){const start=Date.now();let last;while(Date.now()-start<timeout){try{const result=await check();if(result)return result;}catch(error){last=error;}await delay(80);}throw new Error(`Timed out: ${label}${last?' ('+last.message+')':''}`);}
function send(method,params={},target=session){const id=++serial;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},15000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(target?{sessionId:target}:{})}));});}
async function evaluate(expression){const response=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(response.exceptionDetails)throw new Error(response.exceptionDetails.text+': '+(response.exceptionDetails.exception?.description??expression));return response.result.value;}
const waitDOM=(expression,label)=>until(()=>evaluate(expression),label);
async function route(path,selector){await evaluate(`location.hash=${JSON.stringify('#'+path)}`);await waitDOM(`location.hash===${JSON.stringify('#'+path)}&&!document.querySelector('main').hasAttribute('aria-busy')&&Boolean(document.querySelector(${JSON.stringify(selector)}))`,'route '+path);}
async function click(selector){assert.ok(await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`),'Missing control '+selector);await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);}
async function fill(selector,values){await evaluate(`(()=>{const form=document.querySelector(${JSON.stringify(selector)});for(const [name,value]of Object.entries(${JSON.stringify(values)})){const input=form.elements.namedItem(name);if(!input)throw new Error('Missing field '+name);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}})()`);}
async function submit(selector){assert.equal(await evaluate(`document.querySelector(${JSON.stringify(selector)}).checkValidity()`),true,'Native validation '+selector);await evaluate(`document.querySelector(${JSON.stringify(selector)}).requestSubmit()`);}
async function screenshot(name,width=1440){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});await delay(100);const capture=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(artifacts,name+'.png'),Buffer.from(capture.data,'base64'));}

try{
 app=await createApp({demoMode:true});
 await new Promise((resolve,reject)=>{app.server.once('error',reject);app.server.listen(0,'127.0.0.1',resolve);});
 const origin=`http://127.0.0.1:${app.server.address().port}`;
 chrome=spawn(chromeBin,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 chrome.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-6000);});
 let startupError;chrome.on('error',error=>{startupError=error;});
 const active=await until(async()=>{if(startupError)throw startupError;return readFile(join(profile,'DevToolsActivePort'),'utf8').catch(()=>null);},'Chrome DevTools startup');
 const [debugPort,debugPath]=active.trim().split('\n');
 socket=new WebSocket(`ws://127.0.0.1:${debugPort}${debugPath}`);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const waiter=pending.get(message.id);if(!waiter)return;pending.delete(message.id);clearTimeout(waiter.timer);if(message.error)waiter.reject(new Error(message.error.message));else waiter.resolve(message.result??{});}else if(message.method==='Runtime.exceptionThrown'){browserErrors.push(message.params.exceptionDetails.exception?.description??message.params.exceptionDetails.text);}else if(message.method==='Runtime.consoleAPICalled'&&message.params.type==='error'){browserErrors.push(message.params.args.map(a=>a.value??a.description).join(' '));}});
 const target=await send('Target.createTarget',{url:'about:blank'},null);
 session=(await send('Target.attachToTarget',{targetId:target.targetId,flatten:true},null)).sessionId;
 await send('Page.enable');await send('Runtime.enable');
 await mkdir(artifacts,{recursive:true});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:origin});
 await waitDOM(`Boolean(document.querySelector('.home-taskbar'))&&!document.querySelector('main').hasAttribute('aria-busy')`,'home bootstrap');
 assert.equal(await evaluate(`document.querySelectorAll('.category-cell').length`),12);
 await screenshot('home-desktop');

 // Sign in through the rendered form; the same HttpOnly session drives later pages.
 await click('[data-auth="login"]');
 await fill('[data-form="login"]',{email:'buyer@demo.savesmart.test',password:'DemoCompare24!'});
 await submit('[data-form="login"]');
 await waitDOM(`Boolean(document.querySelector('[data-account]'))&&!document.querySelector('dialog').open`,'buyer sign-in');
 await route('/sector/home','.r-sector-workbench');
 await click('a[href="#/brief/home"]');
 await waitDOM(`Boolean(document.querySelector('[data-form="sector-brief"]'))`,'sector-specific brief');
 await fill('[data-form="sector-brief"]',{title:'Clean one split AC',location:'Dhaka',budget:'2000'});
 await evaluate(`(()=>{const form=document.querySelector('[data-form="sector-brief"]');for(const input of form.querySelectorAll('[name^="scope:"]'))input.value='One unit; confirm full scope and charges';})()`);
 await submit('[data-form="sector-brief"]');
 await waitDOM(`Boolean(document.querySelector('[data-form="request"]'))`,'consent review handoff');
 assert.match(await evaluate(`document.querySelector('[data-form="request"]').elements.details.value`),/Comparison brief/);
 assert.equal(await evaluate(`document.querySelector('[name="contactConsent"]').checked`),false);

 await route('/products?category=home','.r-product-row');
 await click('.r-product-row h2 a');
 await waitDOM(`Boolean(document.querySelector('[data-r-differences]'))&&!document.querySelector('main').hasAttribute('aria-busy')`,'canonical product');
 assert.equal(await evaluate(`document.querySelectorAll('.offer-row').length`),3);
 await click('[data-r-differences]');
 assert.ok(await evaluate(`document.querySelectorAll('.r-attribute-table tr[data-comparison-attribute][hidden]').length>0`));
 assert.equal(await evaluate(`document.querySelector('.r-attribute-table tbody tr').hidden`),false);
 await screenshot('comparison-desktop');
 await screenshot('comparison-mobile',390);
 assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+2`),'Mobile comparison must scroll within its table');
 await click('a[href^="#/compare?ids="]');
 await waitDOM(`Boolean(document.querySelector('[data-differences-only]'))`,'legacy comparison');
 await click('[data-differences-only]');
 assert.ok(await evaluate(`document.querySelectorAll('.compare-table tr[data-comparison-attribute][hidden]').length>0`));
 assert.equal(await evaluate(`document.querySelector('.compare-table tbody tr').hidden`),false);

 // These checks use actual browser constraint validation after type-change events.
 await route('/community/submit','[data-r-form="compose"]');
 await fill('[data-r-form="compose"]',{title:'A question about complete service pricing',terms:'How should providers quote parts, labor and the final payable amount?'});
 assert.equal(await evaluate(`document.querySelector('[name="price"]').required`),true);
 await fill('[data-r-form="compose"]',{kind:'coupon'});
 assert.equal(await evaluate(`document.querySelector('[name="price"]').required`),false);
 assert.equal(await evaluate(`document.querySelector('[name="code"]').required`),true);
 assert.equal(await evaluate(`document.querySelector('[name="url"]').required`),true);
 assert.equal(await evaluate(`document.querySelector('[data-r-form="compose"]').checkValidity()`),false);
 await fill('[data-r-form="compose"]',{kind:'discussion'});
 assert.equal(await evaluate(`document.querySelector('[name="price"]').disabled`),true);
 assert.equal(await evaluate(`document.querySelector('[name="expiresAt"]').disabled`),true);
 assert.equal(await evaluate(`document.querySelector('[data-r-form="compose"]').checkValidity()`),true);
 await click('[data-r-preview]');
 assert.match(await evaluate(`document.querySelector('[data-r-preview-output]').textContent`),/How should providers/);
 await submit('[data-r-form="compose"]');
 await waitDOM(`Boolean(document.querySelector('.r-composer-receipt'))`,'moderated submission receipt');

 await route('/watches','[data-r-form="watch"]');
 await fill('[data-r-form="watch"]',{category:'home',maxPrice:'2000'});
 await submit('[data-r-form="watch"]');
 await waitDOM(`Boolean(document.querySelector('.r-watch [data-r-read-watch]'))`,'persisted watch matches');
 assert.ok(await evaluate(`document.querySelectorAll('.r-unread').length>0`));
 await click('[data-r-read-watch]');
 await waitDOM(`document.querySelectorAll('.r-unread').length===0&&!document.querySelector('main').hasAttribute('aria-busy')`,'watch read state');
 await screenshot('watches-mobile',390);
 await route('/community','.r-community-row');
 await screenshot('community-mobile',390);
 assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+2`),'Mobile community should fit viewport');
 assert.deepEqual(browserErrors,[],'No page exceptions or console errors');
 console.log('Native Chrome smoke passed: home, login, industry brief, consent handoff, canonical and legacy differences, composer validation/preview/submission, private watch creation/read state, desktop and 390px layouts.');
 console.log('Screenshots: '+artifacts);
}catch(error){
 if(socket?.readyState===WebSocket.OPEN&&session){try{await screenshot('failure');}catch{}}
 console.error(stderr);throw error;
}finally{
 for(const waiter of pending.values()){clearTimeout(waiter.timer);waiter.reject(new Error('Browser smoke shutting down'));}
 pending.clear();socket?.close();
 if(chrome&&!chrome.killed){chrome.kill('SIGTERM');await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),delay(2000)]);if(chrome.exitCode===null)chrome.kill('SIGKILL');}
 if(app){if(app.server.listening)await app.close();else app.db.close();}
 await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:100});
}
