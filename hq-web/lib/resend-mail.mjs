import {readJSON} from './provider-read.mjs';
import {validTemplateId} from './resend-templates.mjs';
export const productDomains=['karpilo-liq.com','karpiloliq.com','karpiloloadiq.com'];
export function productAddress(value){return typeof value==='string'&&productDomains.some(d=>new RegExp('@'+d.replaceAll('.','\\.')+'(?:>|$)','i').test(value.trim()));}
export function productMail(mail,folder){return folder==='sent'?productAddress(mail.from):(Array.isArray(mail.to)?mail.to:[mail.to]).some(productAddress);}
const summary=x=>({id:x.id,from:x.from||'',to:Array.isArray(x.to)?x.to:[],subject:x.subject||'(No subject)',createdAt:x.created_at||null,status:x.last_event||'received'});
export async function readMail(env,{folder='sent',id='',after=''}={},fetcher=fetch){
 if(!['sent','inbox'].includes(folder)||(id&&!validTemplateId(id))||(after&&!validTemplateId(after)))return {status:'invalid-request',reason:'Invalid mailbox request.'};
 if(!env.RESEND_API_KEY)return {status:'unconfigured',reason:'Resend access is not configured.'};
 const base='https://api.resend.com/emails'+(folder==='inbox'?'/receiving':'');
 const r=await readJSON(base+(id?'/'+encodeURIComponent(id):'?limit=20'+(after?'&after='+encodeURIComponent(after):'')),'Bearer '+env.RESEND_API_KEY,fetcher);
 if(r.status!=='connected')return {status:r.status,reason:folder==='inbox'?'Resend receiving history is unavailable. This is separate from the Workspace inbox.':'Delivery history could not be read.'};
 if(id){const x=r.data;if(x?.id!==id||!productMail(x,folder))return {status:'unavailable',reason:'This message is outside the LoadIQ mailbox scope or unavailable.'};return {status:'connected',message:{...summary(x),html:typeof x.html==='string'?x.html:'',text:typeof x.text==='string'?x.text:'',attachments:Array.isArray(x.attachments)?x.attachments.map(a=>({filename:a.filename||'Attachment',contentType:a.content_type||null})):[]}};}
 if(!Array.isArray(r.data?.data)||typeof r.data.has_more!=='boolean')return {status:'unavailable',reason:'Mailbox response was invalid.'};
 const page=r.data.data.slice(0,20);
 return {status:'connected',messages:page.filter(x=>validTemplateId(x?.id)&&productMail(x,folder)).map(summary),nextCursor:r.data.has_more?page.at(-1)?.id:null,hasMore:r.data.has_more,checkedAt:new Date().toISOString(),reason:'Product-domain messages from this provider page only. Resend receiving is separate from Gmail / Workspace; no routing changes have been made.'};
}
