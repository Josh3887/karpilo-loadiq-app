import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
const specs=[
 {name:'AWS',env:['AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','AWS_REGION'],usage:'Cost Explorer / CloudWatch',billing:'Cost Explorer'},
 {name:'GitHub',env:['GITHUB_TOKEN'],url:'https://api.github.com/user',headers:()=>({Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','User-Agent':'Karpilo-LoadIQ-HQ'}),usage:'Actions and API usage',billing:'Billing API'},
 {name:'Vercel',env:['VERCEL_TOKEN'],url:'https://api.vercel.com/v9/projects?limit=1',headers:()=>({Authorization:'Bearer '+process.env.VERCEL_TOKEN}),usage:'Deployments and observability',billing:'Usage and invoices'},
 {name:'Resend',env:['RESEND_API_KEY'],url:'https://api.resend.com/domains',headers:()=>({Authorization:'Bearer '+process.env.RESEND_API_KEY}),usage:'Email delivery and templates',billing:'Email quotas and invoices'},
 {name:'Twilio',env:['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN'],url:()=> 'https://api.twilio.com/2010-04-01/Accounts/'+encodeURIComponent(process.env.TWILIO_ACCOUNT_SID)+'.json',headers:()=>({Authorization:'Basic '+Buffer.from(process.env.TWILIO_ACCOUNT_SID+':'+process.env.TWILIO_AUTH_TOKEN).toString('base64')}),usage:'Verification and SMS',billing:'Usage records and balance'},
 {name:'PostHog',env:['POSTHOG_PERSONAL_API_KEY','POSTHOG_HOST','POSTHOG_PROJECT_ID'],url:()=>new URL('/api/projects/'+encodeURIComponent(process.env.POSTHOG_PROJECT_ID)+'/',process.env.POSTHOG_HOST).toString(),headers:()=>({Authorization:'Bearer '+process.env.POSTHOG_PERSONAL_API_KEY}),usage:'Events and sessions',billing:'Billing/usage'},
 {name:'Sentry',env:['SENTRY_AUTH_TOKEN'],url:'https://sentry.io/api/0/organizations/',headers:()=>({Authorization:'Bearer '+process.env.SENTRY_AUTH_TOKEN}),usage:'Issues and events',billing:'Plan usage'},
 {name:'Cloudflare',env:['CLOUDFLARE_API_TOKEN'],url:'https://api.cloudflare.com/client/v4/user/tokens/verify',headers:()=>({Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN}),usage:'Requests and security',billing:'Subscription and usage'},
 {name:'Redis',env:['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'],url:()=>new URL('/ping',process.env.UPSTASH_REDIS_REST_URL).toString(),headers:()=>({Authorization:'Bearer '+process.env.UPSTASH_REDIS_REST_TOKEN}),usage:'Commands/storage',billing:'Plan and overages'},
 {name:'Google Maps Platform',env:['GOOGLE_MAPS_API_KEY','GOOGLE_CLOUD_PROJECT_ID'],usage:'Address Validation, Places, Routes',billing:'Cloud Billing SKUs'},
 {name:'Gemini / Google',env:['GEMINI_API_KEY'],usage:'Tokens and requests',billing:'Google Cloud Billing'},
 {name:'EIA',env:['EIA_API_KEY'],usage:'Fuel data calls',billing:'Provider allowance'},
 {name:'Termly',env:['TERMLY_API_KEY'],usage:'Consent/legal',billing:'Subscription'},
 {name:'Stripe',env:['STRIPE_SECRET_KEY'],usage:'Payments/refunds/disputes',billing:'Processing fees'},
 {name:'Gmail / Workspace',env:['GOOGLE_WORKSPACE_CLIENT_ID','GOOGLE_WORKSPACE_CLIENT_SECRET'],usage:'Mail and storage',billing:'Workspace subscriptions'},
 {name:'Private Network / VPN',env:[],usage:'Traffic/connection health',billing:'Subscription'}
];
async function check(spec){
 const missing=spec.env.filter(key=>!process.env[key]);
 const base={name:spec.name,usageCategory:spec.usage,billingCategory:spec.billing,usageValue:null,billedAmount:null,currency:null,lastBillingSync:null};
 if(!spec.env.length)return {...base,status:'unidentified',checkedAt:null};
 if(missing.length)return {...base,status:'unconfigured',missingCredentials:missing,checkedAt:null};
 if(!spec.url)return {...base,status:'credentials-present',checkedAt:null,note:'Adapter and billing scopes not yet verified'};
 try{
  const url=typeof spec.url==='function'?spec.url():spec.url;
  const response=await fetch(url,{headers:spec.headers(),cache:'no-store',signal:AbortSignal.timeout(6000),redirect:'error'});
  return {...base,status:response.ok?'connected':'error',httpStatus:response.status,checkedAt:new Date().toISOString()};
 }catch{return {...base,status:'error',checkedAt:new Date().toISOString()}}
}
export async function GET(){
 const providers=await Promise.all(specs.map(check));
 return NextResponse.json({generatedAt:new Date().toISOString(),providers,disclaimer:'Connection check is not a billing reconciliation; unknown amounts remain null.'},{headers:{'Cache-Control':'private, no-store'}});
}
