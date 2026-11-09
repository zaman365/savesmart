import {api} from './api.js';
import {e,field,icon} from './ui.js';

// No provider receives this draft until the member reviews it and consents in Ask Once.
export function briefRequestParams(data){
 const specification=Object.entries(data).filter(([key])=>key.startsWith('scope:')).map(([key,value])=>`${key.slice(6)}: ${String(value).trim()}`).join('\n');
 const details=`Comparison brief\n${specification}\nAdditional context: ${data.notes||'None supplied'}\nPlease separate included work, mandatory charges, optional extras and cancellation terms.`;
 if(details.length>2800)throw new Error('Shorten the brief so it fits the provider request.');
 return new URLSearchParams({category:data.category,title:data.title,location:data.location,budget:data.budget,details});
}

export async function renderBriefPage(category,state){
 const {category:c,schema,guide}=await api('/api/sectors/'+encodeURIComponent(category));
 return `<div class="container"><div class="page-head"><a class="breadcrumb" href="#/sector/${e(c.id)}">${e(c.name)} / Your brief</a><div class="eyebrow">Ask Once · One scope for every provider</div><h1>Give the comparison a clear brief.</h1><p>Describe the same requirements once. Review the request before it goes to suitable providers.</p></div><div class="workspace split"><form class="paper-panel form-grid" data-form="sector-brief"><input type="hidden" name="category" value="${e(c.id)}">${field('Name this request','title',{min:5,max:140,wide:true,placeholder:'The decision or job you need help with'})}${field('Service location / destination','location',{max:100,value:state.location??'Dhaka'})}${field('Whole budget (BDT)','budget',{type:'number',min:1,max:1000000000})}<div class="wide inline-note">Be specific where you can. If a requirement is flexible, say so. Keep passwords, financial account numbers and sensitive health details out of this brief.</div>${schema.map(f=>field(f.label,'scope:'+f.label,{min:2,max:240,required:Boolean(f.required),wide:true,placeholder:f.why})).join('')}${field('Anything else providers should know?','notes',{type:'textarea',max:700,required:false,wide:true})}<div class="form-actions"><button class="button" type="submit">Review my request ${icon('arrow')}</button></div></form><aside class="side-note"><h3>Better scope. More useful replies.</h3><ol><li>Define the same requirements for every provider.</li><li>Review your budget, timing and contact consent.</li><li>Receive quotes in your Life Board and compare their full terms.</li></ol><p>This creates an enquiry draft. No contact details are shared and no booking is made at this step.</p>${guide?`<a class="text-link" href="#/guide/${encodeURIComponent(guide.id)}">Read the decision guide ${icon('arrow')}</a>`:''}</aside></div></div>`;
}
