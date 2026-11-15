import {AccessError,createRouter,deliveryGuard} from './access.mjs';
import {createAnalytics} from './analytics.mjs';
import {createTemplates} from './templates.mjs';

export const providerKeys = new Set([
 'HQ_TWILIO_ACCOUNT_SID','HQ_TWILIO_AUTH_TOKEN','HQ_RESEND_TOKEN','HQ_VERCEL_TOKEN','HQ_VERCEL_PROJECT','HQ_VERCEL_TEAM',
 'HQ_SENTRY_TOKEN','HQ_SENTRY_ORG','HQ_SENTRY_PROJECT',
 'HQ_POSTHOG_TOKEN','HQ_POSTHOG_PROJECT','HQ_POSTHOG_HOST'
]);
export function parseProviderConfig(raw) {
 const input=JSON.parse(raw);
 if(!input||Array.isArray(input)||typeof input!=='object')throw Error('Invalid provider configuration');
 const output={};
 for(const [key,value]of Object.entries(input))if(providerKeys.has(key)){
  if(typeof value!=='string'||value.length>10000)throw Error('Invalid provider configuration');
  output[key]=value;
 }
 return output;
}
export function createLambdaHandler({verify,allowedSubjects,getConfig,env,fetcher=fetch}) {
 let services,expires=0,pending;
 async function connected(){
  if(services&&Date.now()<expires)return services;
  if(!pending)pending=(async()=>{
   const config=await getConfig();
   services={analytics:createAnalytics(config,fetcher),templates:createTemplates(config,fetcher)};
   expires=Date.now()+60000;return services;
  })().finally(()=>{pending=undefined;});
  return pending;
 }
 const route=createRouter({verify,allowedSubjects,env,
  analytics:async()=>(await connected()).analytics(),
  templates:{list:async(cursor)=>(await connected()).templates.list(cursor),read:async(id)=>(await connected()).templates.read(id)},
  support:()=>{throw new AccessError(503,'Customer service access has not been connected to HQ');}
 });
 return async(event)=>{
  const headers={'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'};
  try{
   deliveryGuard(env);
   if(event.requestContext?.http?.method!=='GET')return{statusCode:405,headers,body:JSON.stringify({error:'This gateway is read-only'})};
   const path=event.rawPath??'/';
   if(!path.startsWith('/v1/'))return{statusCode:404,headers,body:JSON.stringify({error:'Not found'})};
   const query=event.rawQueryString?'?'+event.rawQueryString:'';
   const response=await route(new Request('https://hq.internal'+path+query,{headers:event.headers??{}}));
   return{statusCode:response.status,headers:Object.fromEntries(response.headers),body:await response.text(),isBase64Encoded:false};
  }catch{return{statusCode:503,headers,body:JSON.stringify({error:'HQ gateway unavailable; email remains disabled'})};}
 };
}
