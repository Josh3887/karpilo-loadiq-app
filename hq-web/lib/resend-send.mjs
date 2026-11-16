import {createHash} from 'node:crypto';
import {getTemplate,validTemplateId,variableValues,sendBlocker} from './resend-templates.mjs';
export function normalizeAttachments(value=[]){
 if(!Array.isArray(value)||value.length>5)throw new Error('Use up to five attachments, 2 MB combined.');
 let total=0;
 return value.map(a=>{if(!a||typeof a.filename!=='string'||!a.filename||a.filename.length>120||/[\\/\x00-\x1f]/.test(a.filename)||! /\.(pdf|png|jpe?g|gif|webp|txt|csv|docx|xlsx)$/i.test(a.filename)||typeof a.content!=='string'||(a.content.length%4!==0||/[^A-Za-z0-9+/=]/.test(a.content)||/=[^=]|={3}/.test(a.content)))throw new Error('Unsupported attachment. Use PDF, images, text, CSV, DOCX or XLSX files.');
 const bytes=Buffer.from(a.content,'base64');total+=bytes.length;if(!bytes.length||total>2*1024*1024)throw new Error('Use up to five attachments, 2 MB combined.');return {filename:a.filename,content:a.content};});
}
export const validRecipient=value=>typeof value==='string'&&value.length<=254&&/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(value);
export async function sendTemplateMessage(env,input,fetcher=fetch){
 if(!input||input.confirmed!==true||!validTemplateId(input.templateId)||!validRecipient(input.to)||!/^[-a-zA-Z0-9]{16,80}$/.test(input.requestId||'')||typeof input.version!=='string'||!input.variables||typeof input.variables!=='object'||Array.isArray(input.variables))return {status:'invalid-request',reason:'Review the recipient, template and personalization before sending.'};
 let attachments;try{attachments=normalizeAttachments(input.attachments)}catch(e){return {status:'invalid-request',reason:e.message};}
 const r=await getTemplate(env,input.templateId,fetcher);if(r.status!=='connected')return r;
 const t=r.template,blocked=sendBlocker(t);if(blocked)return {status:'blocked',reason:blocked};
 if(!t.version||input.version!==t.version)return {status:'blocked',reason:'The template changed. Reload and review it before sending.'};
 if(!t.from||!t.subject)return {status:'blocked',reason:'Set the sender and subject on this template in Resend before sending.'};
 const v=variableValues(t,input.variables);if(v.missing.length)return {status:'invalid-request',reason:'Complete all required template fields.',missing:v.missing};
 const payload={...(attachments.length?{attachments}:{}),from:t.from,to:[input.to],subject:t.subject,template:{id:t.id,variables:v.values},...(t.replyTo?{reply_to:t.replyTo}:{})};
 const body=JSON.stringify(payload),key='hq-template/'+input.requestId+'/'+createHash('sha256').update(body).digest('hex');
 try{
  const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':key},body,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!response.ok)return {status:response.status===429?'rate-limited':'error',reason:response.status===429?'Resend is rate-limiting requests. Retry this same message shortly.':'Resend did not accept this message. Check template publication, sender verification and personalization before retrying.'};
  const data=await response.json();
  if(typeof data?.id!=='string')return {status:'unknown',reason:'Acceptance could not be confirmed. Check Resend delivery history before composing another message.'};
  return {status:'accepted',id:data.id,acceptedAt:new Date().toISOString(),reason:'Resend accepted this message. Delivery is tracked separately in Resend Library.'};
 }catch{return {status:'unknown',reason:'The response was interrupted. Retry this same message to reuse its duplicate-prevention key, or check Resend delivery history.'};}
}
