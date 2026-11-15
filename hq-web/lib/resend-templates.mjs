import {readJSON} from './provider-read.mjs';
export const validTemplateId=value=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(value);
export const publicationLabel=status=>status==='published'?'Published':status==='draft'?'Unpublished':status||'Unknown';
export function templateCategory(t){
 const s=(t.name+' '+(t.alias||'')).toLowerCase();
 if(/superseded/.test(s))return 'Superseded';
 if(/trial|snapshot|load|profile|economics/.test(s.replace(/karpilo[ -]?loadiq/g,'')))return 'Load intelligence';
 if(/payment|billing|subscription|refund|renewal|price|dispute/.test(s))return 'Billing';
 if(/deletion|delete|export|privacy|policy/.test(s))return 'Privacy';
 if(/password|sign.in|email.change|security|suspended|restored/.test(s))return 'Security';
 if(/support|feedback/.test(s))return 'Support';
 if(/welcome|access|verification/.test(s))return 'Enrollment';
 if(/referral|loyalty|founding|tier|monthly/.test(s))return 'Marketing';
 return 'Operations';
}
const summary=x=>({id:x.id,name:x.name,alias:x.alias??null,status:x.status??'unknown',createdAt:x.created_at??null,updatedAt:x.updated_at??null});
export async function listTemplates(env,after='',fetcher=fetch){
 if(after&&!validTemplateId(after))return {status:'invalid-request',reason:'Invalid template cursor.'};
 if(!env.RESEND_API_KEY)return {status:'unconfigured',reason:'Resend credentials are unavailable.'};
 const r=await readJSON('https://api.resend.com/templates?limit=100'+(after?'&after='+encodeURIComponent(after):''),'Bearer '+env.RESEND_API_KEY,fetcher);
 if(r.status!=='connected')return {status:r.status,reason:'Template inventory could not be loaded.'};
 if(!Array.isArray(r.data?.data)||typeof r.data.has_more!=='boolean'||!r.data.data.every(x=>validTemplateId(x?.id)&&typeof x.name==='string'))return {status:'unavailable',reason:'Template inventory response was invalid.'};
 const templates=r.data.data.slice(0,100).map(summary);
 return {status:'connected',templates,hasMore:r.data.has_more,nextCursor:r.data.has_more?templates.at(-1)?.id??null:null,checkedAt:new Date().toISOString()};
}
export async function getTemplate(env,id,fetcher=fetch){
 if(!validTemplateId(id))return {status:'invalid-request',reason:'Invalid template identifier.'};
 if(!env.RESEND_API_KEY)return {status:'unconfigured',reason:'Resend credentials are unavailable.'};
 const r=await readJSON('https://api.resend.com/templates/'+encodeURIComponent(id),'Bearer '+env.RESEND_API_KEY,fetcher);
 if(r.status!=='connected')return {status:r.status,reason:'The template could not be loaded.'};
 const x=r.data;
 if(!validTemplateId(x?.id)||!(x.id===id||x.alias===id)||typeof x.name!=='string'||(x.html!=null&&typeof x.html!=='string')||(x.text!=null&&typeof x.text!=='string')||!Array.isArray(x.variables))return {status:'unavailable',reason:'Template response was invalid.'};
 if(x.variables.some(v=>!v||(!/^\w{1,50}$/.test(v.key)||['__proto__','constructor','prototype'].includes(v.key))||!['string','number'].includes(v.type)))return {status:'unavailable',reason:'Template variables could not be read.'};
 return {status:'connected',template:{...summary(x),version:x.current_version_id??null,publishedAt:x.published_at??null,hasUnpublishedVersions:x.has_unpublished_versions===true,from:x.from??'',subject:x.subject??'',replyTo:x.reply_to??null,html:x.html??'',text:x.text??'',variables:x.variables.map(v=>({key:v.key,type:v.type,fallback:v.fallback_value??null}))}};
}
export function variableValues(template,values={}){
 const result={},missing=[];
 for(const v of template.variables){
  const raw=Object.hasOwn(values,v.key)&&values[v.key]!==''?values[v.key]:v.fallback;
  if(raw===null||raw===undefined||raw===''){missing.push(v.key);continue;}
  if(v.type==='number'){
   const n=Number(raw);if(!Number.isFinite(n)||Math.abs(n)>Number.MAX_SAFE_INTEGER){missing.push(v.key);continue;}result[v.key]=n;
  }else{if(typeof raw!=='string'||raw.length>2000){missing.push(v.key);continue;}result[v.key]=raw;}
 }
 return {values:result,missing};
}
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function fillTemplate(source,values,html=false){return (source||'').replace(/\{\{\{\s*(\w+)\s*\}\}\}/g,(whole,key)=>Object.hasOwn(values,key)?html?escapeHTML(values[key]):String(values[key]):whole);}
export function sendBlocker(template){
 const declared=new Set(template.variables.map(v=>v.key));
 const undeclared=[...new Set([...((template.html||'')+(template.text||'')+(template.subject||'')).matchAll(/\{\{\{\s*(\w+)\s*\}\}\}/g)].map(m=>m[1]).filter(k=>!declared.has(k)))];
 if(undeclared.length)return 'Define these template fields in Resend before sending: '+undeclared.join(', ')+'.';
 if(templateCategory(template)==='Superseded')return 'This template is superseded.';
 if(template.status!=='published')return 'Publish this reusable template in Resend before sending it.';
 if(template.hasUnpublishedVersions)return 'This template has unpublished changes. Publish or resolve them in Resend before sending the previewed content.';
 return null;
}
