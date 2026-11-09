import {api} from './api.js';
import {e,money,icon,field,categoryOptions,dialog,closeDialog,toast,formError} from './ui.js';

let installed=false;
const url=()=>new URL(location.hash.slice(1)||'/',location.origin);
const cleanFields=form=>Object.fromEntries([...new FormData(form)].filter(([,v])=>typeof v==='string'));

export function composePayload(form){
 const data=cleanFields(form),discussion=data.kind==='discussion',unpriced=discussion||(data.kind==='coupon'&&(data.price===undefined||data.price===''));
 return {...data,price:unpriced?null:data.price===''||data.price===undefined?null:Number(data.price),fees:unpriced?0:data.fees===''||data.fees===undefined?null:Number(data.fees),expiresAt:discussion?null:data.expiresAt,code:data.kind==='coupon'?(data.code??''):'',disclosure:data.disclosure??'',location:data.location??'',payment:data.payment??'',comparisonGroup:data.comparisonGroup??''};
}

function syncComposer(form){
 const discussion=form.elements.kind.value==='discussion',coupon=form.elements.kind.value==='coupon';
 const prices=form.querySelector('[data-r-price-fields]');
 if(prices){prices.hidden=discussion;prices.querySelectorAll('input').forEach(input=>{input.disabled=discussion;input.required=!discussion&&((input.name==='price'&&!coupon)||input.name==='expiresAt'||(input.name==='fees'&&(!coupon||form.elements.price.value!=='')));});}
 const code=form.querySelector('[data-r-code-field]');
 if(code){code.hidden=!coupon;const input=code.querySelector('input');input.disabled=!coupon;input.required=coupon;}
 if(form.elements.disclosure)form.elements.disclosure.required=form.elements.origin.value==='merchant';
 if(form.elements.url)form.elements.url.required=coupon;
 const priceLabel=form.elements.price?.closest('.field')?.querySelector('span');if(priceLabel)priceLabel.textContent=coupon?'Known base price (optional, BDT)':'Base price (BDT)';
}

export function previewPostHTML(data){
 const hasTotal=data.price!==null&&data.price!==undefined&&data.fees!==null&&data.fees!==undefined;
 return `<div class="r-post-meta"><span>${e(data.kind)}</span><span>${e(data.category)}</span><span>${e(data.origin??'community')}</span></div><h2>${e(data.title||'Your post title')}</h2>${data.kind==='discussion'?'':!hasTotal?'<p class="minor">No complete payable total is supplied. Read the full terms.</p>':`<div class="r-preview-total">${money((Number(data.price)||0)+(Number(data.fees)||0))}<small>Total including ${money(Number(data.fees)||0)} listed fees</small></div>`}<p class="r-preserve-lines">${e(data.terms||'The inclusions, exclusions and useful context appear here.')}</p>${data.code?`<p>Code: <code class="r-coupon-code">${e(data.code)}</code></p>`:''}${data.location?`<p class="minor">Location: ${e(data.location)}</p>`:''}${data.payment?`<p class="minor">Payment: ${e(data.payment)}</p>`:''}${data.disclosure?`<div class="r-disclosure"><strong>Commercial connection</strong><p>${e(data.disclosure)}</p></div>`:''}<p class="r-note">Preview only. This post has not been submitted or published. Reference-price evidence is reviewed separately.</p>`;
}

function differencesOnly(enabled){
 document.querySelectorAll('.compare-table,.r-attribute-table').forEach(table=>{
  table.querySelectorAll('tbody tr').forEach(row=>{
   const cells=[...row.querySelectorAll('td')];
   const values=cells.map(cell=>cell.textContent.trim().replace(/\s+/g,' '));
   const actionable=cells.some(cell=>cell.querySelector('a,button,input'));
   // Keep prices, fees, rebates and decision actions in view even when equal.
   row.hidden=enabled&&row.hasAttribute('data-comparison-attribute')&&!actionable&&values.length>1&&new Set(values).size===1;
  });
 });
}

export function installReverseClient({getState,render,go,needAuth}){
 if(installed)return;installed=true;
 const watchForm=(initial={})=>`<form data-r-form="watch" class="dialog-form">${field('Keyword or phrase','query',{required:false,value:initial.query??'',min:2,max:120})}${field('Industry','category',{type:'select',required:false,options:'<option value="">Any industry</option>'+categoryOptions(getState().categories,initial.category??'')})}${field('Maximum payable total (BDT)','maxPrice',{type:'number',required:false,min:0,value:initial.maxPrice??''})}<p class="minor">Add a keyword, an industry, or both. Matching items appear in your watch desk; email and push delivery are not enabled.</p><button type="submit" class="button">Keep this watch ${icon('bookmark')}</button></form>`;

 document.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button)return;
  try{
   if(button.hasAttribute('data-r-new-compose')){await render();return;}
   if(button.hasAttribute('data-r-watch-search')){
    if(!needAuth())return;const p=url().searchParams;
    dialog('Keep an eye on this need.',watchForm({query:p.get('q')??'',category:p.get('category')??'',maxPrice:p.get('max')??''}));return;
   }
   if(button.hasAttribute('data-r-vote')){
    if(!needAuth())return;button.disabled=true;
    try{await api(`/api/community/${encodeURIComponent(button.dataset.rPost)}/vote`,{method:'POST',body:{value:button.getAttribute('aria-pressed')==='true'?0:Number(button.dataset.rVote)}});await render(false);}finally{button.disabled=false;}return;
   }
   if(button.hasAttribute('data-r-preview')){
    const form=button.closest('[data-r-form="compose"]');syncComposer(form);if(!form.reportValidity())return;
    const output=document.querySelector('[data-r-preview-output]');output.innerHTML=previewPostHTML(composePayload(form));
    if(matchMedia('(max-width: 800px)').matches)output.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    return;
   }
   if(button.hasAttribute('data-r-read-watch')){
    await api(`/api/watches/${encodeURIComponent(button.dataset.rReadWatch)}/read`,{method:'POST',body:{}});await render(false);toast('Current watch matches are marked as read.');return;
   }
   if(button.hasAttribute('data-r-delete-watch')){
    dialog('Remove this watch?',`<p class="dialog-intro">This search rule and its matching-item read history will be removed from your account.</p><form data-r-form="delete-watch" class="dialog-form"><input type="hidden" name="id" value="${e(button.dataset.rDeleteWatch)}"><div class="r-form-actions"><button type="submit" class="button">Remove watch</button><button type="button" class="button secondary" data-close>Keep it</button></div></form>`);return;
   }
   if(button.hasAttribute('data-r-report')){
    if(!needAuth())return;
    dialog('Help keep the record useful.',`<form data-r-form="report" class="dialog-form"><input type="hidden" name="kind" value="${e(button.dataset.rKind??'deal')}"><input type="hidden" name="entityId" value="${e(button.dataset.rReport)}">${field('What needs attention?','reason',{type:'select',options:'<option value="expired">Expired or unavailable</option><option value="incorrect_price">Incorrect or incomplete price</option><option value="wrong_scope">Scope or product does not match</option><option value="misleading">Misleading information or undisclosed relationship</option><option value="other">Another concern</option>'})}${field('The details that help a review','detail',{type:'textarea',min:10,max:2000,placeholder:'Describe what changed, what is missing and where it can be checked.'})}<p class="minor">A report asks for review; it is not an automatic finding against the author or business.</p><button type="submit" class="button">Send for review</button></form>`);return;
   }
   if(button.hasAttribute('data-r-review')){
    dialog(button.dataset.rDecision==='resolved'?'Record how this report was resolved.':'Record why this report is dismissed.',`<form data-r-form="report-review" class="dialog-form"><input type="hidden" name="id" value="${e(button.dataset.rReview)}"><input type="hidden" name="decision" value="${e(button.dataset.rDecision)}">${field('Decision reason','reason',{type:'textarea',min:5,max:1000})}<p class="minor">This records the report outcome. Use Withdraw the published record separately when it should leave public results.</p><button type="submit" class="button">Record outcome</button></form>`);return;
   }
   if(button.hasAttribute('data-r-withdraw')){
    dialog('Withdraw this published record?',`<p class="dialog-intro">This removes the offer or community post from public results and new watch matches. Its record and review history are retained. The report outcome is recorded separately.</p><form data-r-form="withdraw" class="dialog-form"><input type="hidden" name="kind" value="${e(button.dataset.rKind)}"><input type="hidden" name="entityId" value="${e(button.dataset.rWithdraw)}">${field('Evidence and reason for withdrawal','reason',{type:'textarea',min:10,max:1000})}<div class="r-form-actions"><button type="submit" class="button">Withdraw from public results</button><button type="button" class="button secondary" data-close>Keep published</button></div></form>`);return;
   }
   if(button.hasAttribute('data-r-copy-code')){
    try{await navigator.clipboard.writeText(button.dataset.rCopyCode);toast('Coupon code copied. Check all eligibility conditions before using it.');}
    catch{dialog('Your coupon code.',`<p><code class="r-coupon-code">${e(button.dataset.rCopyCode)}</code></p><p class="minor">Select the code to copy it. The original offer terms still apply.</p>`);}return;
   }
  }catch(error){toast(error.message);}
 });

 document.addEventListener('input',event=>{if(event.target.matches('[data-r-form="compose"] [name="price"]'))syncComposer(event.target.closest('form'));});

 document.addEventListener('change',event=>{
  const input=event.target;
  if(input.matches('[data-r-differences],[data-differences-only]'))differencesOnly(input.checked);
  if(input.matches('[data-r-form="compose"] [name="kind"],[data-r-form="compose"] [name="origin"]'))syncComposer(input.closest('form'));
 });

 document.addEventListener('submit',async event=>{
  const form=event.target.closest('[data-r-form]');if(!form)return;
  event.preventDefault();const kind=form.dataset.rForm,button=form.querySelector('[type="submit"]');
  form.querySelector('.form-error')?.remove();if(button)button.disabled=true;
  try{
   const data=cleanFields(form);
   if(kind==='products'||kind==='community'){
    const query=new URLSearchParams(Object.entries(data).filter(([,value])=>value!==''));go('/'+(kind==='products'?'products':'community')+'?'+query);return;
   }
   if(kind==='compose'){
    syncComposer(form);if(!form.reportValidity())return;
    const result=await api('/api/community',{method:'POST',body:composePayload(form)});
    form.innerHTML=`<div class="r-composer-receipt"><span class="empty-mark">${icon('check')}</span><div class="eyebrow">Submitted for review</div><h2>Your find is in the review queue.</h2><p>It will not appear publicly until approved. Keep the source and terms handy in case clarification is needed.</p><p class="minor break-anywhere">Submission: ${e(result.id)}</p><div class="r-form-actions"><a class="button" href="#/community">Back to the community</a><button type="button" class="button secondary" data-r-new-compose>Share another find</button></div></div>`;
    const output=document.querySelector('[data-r-preview-output]');if(output)output.innerHTML='<h2>Thanks for bringing the details.</h2><p>The submitted record is pending review. It is not yet a published deal.</p>';return;
   }
   if(kind==='watch'){
    await api('/api/watches',{method:'POST',body:{query:data.query??'',category:data.category??'',maxPrice:data.maxPrice===''?null:Number(data.maxPrice)}});
    if(form.closest('dialog'))closeDialog();
    if(url().pathname==='/watches')await render(false);
    toast('Your watch is saved. See current matches in the watch desk.');return;
   }
   if(kind==='delete-watch'){
    await api('/api/watches/'+encodeURIComponent(data.id),{method:'DELETE'});closeDialog();await render(false);toast('Watch removed.');return;
   }
   if(kind==='comment'){
    await api(`/api/community/${encodeURIComponent(data.postId)}/comments`,{method:'POST',body:{body:data.body}});await render(false);toast('Your comment has been added.');return;
   }
   if(kind==='report'){
    await api('/api/reports',{method:'POST',body:data});closeDialog();toast('Your report has been sent for review.');return;
   }
   if(kind==='report-review'){
    await api(`/api/reports/${encodeURIComponent(data.id)}/review`,{method:'POST',body:{decision:data.decision,reason:data.reason}});closeDialog();await render(false);toast('Report outcome recorded.');return;
   }
   if(kind==='withdraw'){
    await api('/api/moderation/withdraw',{method:'POST',body:{kind:data.kind,entityId:data.entityId,reason:data.reason}});closeDialog();await render(false);toast('The record has been withdrawn from public results.');return;
   }
  }catch(error){formError(form,error.message);}finally{if(button)button.disabled=false;}
 });
}
