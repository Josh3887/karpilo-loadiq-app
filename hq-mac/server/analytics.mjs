import {readTwilio} from './twilio-read.mjs';
const encode=encodeURIComponent;
export function createAnalytics(env,fetcher=fetch) {
 let cached,expires=0,inflight;
 const definitions=[
  {name:'Resend',ready:()=>env.HQ_RESEND_TOKEN,url:()=>new URL('https://api.resend.com/domains?limit=100'),token:()=>env.HQ_RESEND_TOKEN,normalize:j=>({label:'Domain status',items:j.data.map(x=>({name:x.name,status:x.status})),partial:!!j.has_more})},
  {name:'Vercel',ready:()=>env.HQ_VERCEL_TOKEN&&env.HQ_VERCEL_PROJECT,url:()=>new URL(`https://api.vercel.com/v6/deployments?projectId=${encode(env.HQ_VERCEL_PROJECT)}&limit=20${env.HQ_VERCEL_TEAM?'&teamId='+encode(env.HQ_VERCEL_TEAM):''}`),token:()=>env.HQ_VERCEL_TOKEN,normalize:j=>({label:'Recent deployments (up to 20)',items:j.deployments.map(x=>({name:x.name,status:x.state??x.readyState,created:x.created})),partial:!!j.pagination?.next})},
  {name:'Sentry',ready:()=>env.HQ_SENTRY_TOKEN&&env.HQ_SENTRY_ORG&&env.HQ_SENTRY_PROJECT,url:()=>new URL(`https://sentry.io/api/0/organizations/${encode(env.HQ_SENTRY_ORG)}/issues/?project=${encode(env.HQ_SENTRY_PROJECT)}&query=is%3Aunresolved&limit=25`),token:()=>env.HQ_SENTRY_TOKEN,normalize:j=>({label:'Unresolved issues (up to 25)',items:j.map(x=>({name:x.shortId,status:x.status,count:x.count,lastSeen:x.lastSeen})),partial:true})},
  {name:'PostHog',ready:()=>env.HQ_POSTHOG_TOKEN&&env.HQ_POSTHOG_PROJECT&&['us.posthog.com','eu.posthog.com'].includes(env.HQ_POSTHOG_HOST),url:()=>new URL(`https://${env.HQ_POSTHOG_HOST}/api/projects/${encode(env.HQ_POSTHOG_PROJECT)}/insights/?limit=25`),token:()=>env.HQ_POSTHOG_TOKEN,normalize:j=>({label:'Saved insights (not event totals)',items:j.results.map(x=>({name:String(x.id),status:x.last_refresh??'Never refreshed'})),partial:!!j.next})}
 ];
 async function collect(d){
  const observedAt=new Date().toISOString();
  if(!d.ready())return {provider:d.name,state:'not_configured',observedAt,items:[]};
  const start=performance.now();
  try{
   const r=await fetcher(d.url(),{method:'GET',headers:{Authorization:`Bearer ${d.token()}`,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(8000)});
   if(!r.ok)return {provider:d.name,state:r.status===401||r.status===403?'access_denied':r.status===429?'rate_limited':'unavailable',observedAt,items:[]};
   const raw=await r.text();if(Buffer.byteLength(raw)>2000000)throw Error('response too large');
   return {provider:d.name,state:'observed',observedAt,latencyMs:Math.round(performance.now()-start),...d.normalize(JSON.parse(raw))};
  }catch{return {provider:d.name,state:'unavailable',observedAt,items:[]};}
 }
 return async()=>{
  if(cached&&Date.now()<expires)return cached;
  if(inflight)return inflight;
  inflight=(async()=>{
   const providers=await Promise.all(definitions.map(collect));
   const twilio=await readTwilio({TWILIO_ACCOUNT_SID:env.HQ_TWILIO_ACCOUNT_SID,TWILIO_AUTH_TOKEN:env.HQ_TWILIO_AUTH_TOKEN},fetcher);
   providers.push({provider:'Twilio',state:twilio.status==='connected'?'observed':twilio.status==='unconfigured'?'not_configured':twilio.status,observedAt:twilio.checkedAt,label:twilio.reason,partial:twilio.status==='partial'||Object.values(twilio.pagination).some(Boolean),items:[
    ...Object.entries(twilio.coverage).map(([name,status])=>({name,status})),
    ...(twilio.account?[{name:twilio.account.name||'Account',status:twilio.account.status}]:[]),
    ...(twilio.verifyServices||[]).map(x=>({name:x.name||x.id,status:'Verify service'})),
    ...(twilio.messages||[]).map(x=>({name:x.id,status:[x.status,x.errorCode].filter(Boolean).join(' · ')})),
    ...(twilio.usage||[]).map(x=>({name:x.category,status:[x.usage,x.usageUnit,x.price,x.currency].filter(x=>x!==undefined&&x!==null).join(' ')}))
   ]});
   for(const name of ['AWS','GitHub','Redis','Stripe','Google Workspace','Cloudflare','Google Maps Platform','Gemini / Google','EIA','Termly'])providers.push({provider:name,state:'adapter_pending',items:[]});
   cached={emailSending:false,collectedAt:new Date().toISOString(),providers};expires=Date.now()+60000;return cached;
  })();
  try{return await inflight;}finally{inflight=undefined;}
 };
}
