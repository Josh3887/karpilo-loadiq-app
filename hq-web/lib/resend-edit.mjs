import {getTemplate,validTemplateId,templateCategory} from './resend-templates.mjs';
import {productAddress} from './resend-mail.mjs';
export async function editTemplate(env,input,fetcher=fetch){
 if(!input||input.confirmed!==true||!validTemplateId(input.id)||typeof input.version!=='string'||typeof input.name!=='string'||!input.name.trim()||input.name.length>200||typeof input.subject!=='string'||input.subject.length>998||typeof input.html!=='string'||!input.html.trim()||input.html.length>200000)return {status:'invalid-request',reason:'Review the template name, subject and HTML before saving.'};
 const r=await getTemplate(env,input.id,fetcher);if(r.status!=='connected')return r;
 const t=r.template;
 if(!productAddress(t.from)||templateCategory(t)==='Superseded')return {status:'blocked',reason:'Only current LoadIQ sender templates can be edited here.'};
 if(!t.version||t.version!==input.version)return {status:'blocked',reason:'The template changed. Reload it before editing.'};
 const declared=new Set(t.variables.map(v=>v.key));
 const existing=new Set([...((t.html||'')+(t.subject||'')).matchAll(/\{\{\{\s*(\w+)\s*\}\}\}/g)].map(m=>m[1]));
 if([...((input.html||'')+input.subject).matchAll(/\{\{\{\s*(\w+)\s*\}\}\}/g)].some(m=>!declared.has(m[1])&&!existing.has(m[1])))return {status:'blocked',reason:'New template variables must first be defined in Resend.'};
 try{
  const response=await fetcher('https://api.resend.com/templates/'+encodeURIComponent(t.id),{method:'PATCH',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({name:input.name.trim(),subject:input.subject,html:input.html}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!response.ok)return {status:response.status===429?'rate-limited':'error',reason:'Resend did not confirm the template update. Reload before retrying.'};
  const data=await response.json();if(data.id!==t.id)return {status:'unknown',reason:'Update could not be confirmed. Reload the template in Resend.'};
  return {status:'saved',reason:'Template revision saved in Resend. It has not been published. Review and publish in Resend before sending.'};
 }catch{return {status:'unknown',reason:'The response was interrupted. Reload the template before retrying.'};}
}
