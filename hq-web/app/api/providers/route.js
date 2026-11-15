import {NextResponse} from 'next/server';
import {twilioMissingCredentials} from '../../../lib/twilio-read.mjs';
import {getProviderConfig} from '../../../lib/provider-config.mjs';
import {readRedis,readEia,readStripeTest} from '../../../lib/operational-read.mjs';
import {createObservationCache} from '../../../lib/provider-cache.mjs';
const observe=createObservationCache();
const fuelObserve=createObservationCache(3600000);
export const runtime='nodejs';
export const maxDuration=30;
export const dynamic='force-dynamic';
const specs=[
 {name:'AWS',env:['AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','AWS_REGION'],url:null,usage:'ECS / RDS / Lambda / CloudWatch',billing:'Cost Explorer'},
 {name:'GitHub',env:['GITHUB_TOKEN'],url:'https://api.github.com/user',headers:()=>({Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','User-Agent':'Karpilo-LoadIQ-HQ'}),usage:'Actions and API usage',billing:'Billing API'},
 {name:'Vercel',env:['VERCEL_TOKEN'],url:'https://api.vercel.com/v9/projects?limit=1',headers:()=>({Authorization:'Bearer '+process.env.VERCEL_TOKEN}),usage:'Deployments and observability',billing:'Usage and invoices'},
 {name:'Resend',env:['RESEND_API_KEY'],url:'https://api.resend.com/domains',headers:()=>({Authorization:'Bearer '+process.env.RESEND_API_KEY}),usage:'Email delivery and templates',billing:'Email quotas and invoices'},
 {name:'Twilio',env:['TWILIO_ACCOUNT_SID','TWILIO_API_KEY_SID','TWILIO_API_KEY_SECRET'],usage:'Verification and SMS',billing:'Usage records'},
 {name:'PostHog',env:['POSTHOG_PERSONAL_API_KEY','POSTHOG_HOST','POSTHOG_PROJECT_ID'],url:(env)=>new URL('/api/projects/'+encodeURIComponent(env.POSTHOG_PROJECT_ID)+'/',env.POSTHOG_HOST).toString(),headers:(env)=>({Authorization:'Bearer '+env.POSTHOG_PERSONAL_API_KEY}),usage:'Events and sessions',billing:'Billing/usage'},
 {name:'Sentry',env:['SENTRY_AUTH_TOKEN'],url:'https://sentry.io/api/0/organizations/',headers:(env)=>({Authorization:'Bearer '+env.SENTRY_AUTH_TOKEN}),usage:'Issues and events',billing:'Plan usage'},
 {name:'Cloudflare',env:['CLOUDFLARE_API_TOKEN'],url:'https://api.cloudflare.com/client/v4/user/tokens/verify',headers:()=>({Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN}),usage:'Requests and security',billing:'Subscription and usage'},
 {name:'Redis',env:['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'],url:(env)=>new URL('/ping',process.env.UPSTASH_REDIS_REST_URL).toString(),headers:()=>({Authorization:'Bearer '+process.env.UPSTASH_REDIS_REST_TOKEN}),usage:'Commands/storage',billing:'Plan and overages'},
 {name:'Google Maps Platform',env:['GOOGLE_MAPS_API_KEY','GOOGLE_CLOUD_PROJECT_ID'],usage:'Address Validation, Places, Routes',billing:'Cloud Billing SKUs'},
 {name:'Gemini / Google',env:['GEMINI_API_KEY'],usage:'Tokens and requests',billing:'Google Cloud Billing'},
 {name:'EIA',env:['EIA_API_KEY'],usage:'Fuel data calls',billing:'Provider allowance'},
 {name:'Termly',env:['TERMLY_API_KEY'],usage:'Consent/legal',billing:'Subscription'},
 {name:'Stripe',env:['STRIPE_SECRET_KEY'],usage:'Payments/refunds/disputes',billing:'Processing fees'},
 {name:'Gmail / Workspace',env:['GOOGLE_WORKSPACE_CLIENT_ID','GOOGLE_WORKSPACE_CLIENT_SECRET'],usage:'Mail and storage',billing:'Workspace subscriptions'},
 {name:'Private Network / VPN',env:[],usage:'Traffic/connection health',billing:'Subscription'}
];
async function check(spec,env){
 if(spec.name==='Stripe')return {name:spec.name,...await observe('Stripe',()=>readStripeTest(env))};
 if(spec.name==='Redis')return {name:spec.name,...await observe('Redis',()=>readRedis(env))};
 if(spec.name==='EIA')return {name:spec.name,...await fuelObserve('EIA',()=>readEia(env))};
 const missing=spec.name==='Twilio'?twilioMissingCredentials(env):spec.env.filter(key=>!env[key]);
 const base={name:spec.name,usageCategory:spec.usage,billingCategory:spec.billing,usageValue:null,billedAmount:null,currency:null,lastBillingSync:null};
 if(!spec.env.length)return {...base,status:'unidentified',checkedAt:null};
 if(missing.length)return {...base,status:'unconfigured',missingCredentials:missing,checkedAt:null};
 if(['AWS','GitHub','Vercel','Resend','Twilio','Cloudflare'].includes(spec.name))return {...base,status:'credentials-present',checkedAt:null,note:'Live observations supplied by dedicated provider panel.'};
 if(!spec.url)return {...base,status:'credentials-present',checkedAt:null,note:'Credentials present; operational API verification is not implemented for this provider.'};
 try{
  if(spec.name==='PostHog'){const host=new URL(env.POSTHOG_HOST);if(!['us.posthog.com','eu.posthog.com','app.posthog.com'].includes(host.hostname)||host.protocol!=='https:'||host.username||host.password||host.port)throw Error('Invalid PostHog host')}
  const url=typeof spec.url==='function'?spec.url(env):spec.url;
  const response=await fetch(url,{headers:spec.headers(env),cache:'no-store',signal:AbortSignal.timeout(6000),redirect:'error'});
  return {...base,status:response.ok?'connected':'error',httpStatus:response.status,checkedAt:new Date().toISOString()};
 }catch{return {...base,status:'error',checkedAt:new Date().toISOString()}}
}
export async function GET(){
 let env;try{env={...process.env,...await getProviderConfig()}}catch{return NextResponse.json({status:'error',reason:'Provider credential store unavailable',providers:[]},{status:503,headers:{'Cache-Control':'private, no-store'}})}
 const providers=await Promise.all(specs.map(spec=>check(spec,env)));
 return NextResponse.json({generatedAt:new Date().toISOString(),providers,disclaimer:'Connection check is not a billing reconciliation; unknown amounts remain null.'},{headers:{'Cache-Control':'private, no-store'}});
}
