import {readTwilioMonitoring} from '../../../lib/twilio-monitoring.mjs';
import {readGoogleMonitoring} from '../../../lib/google-monitoring.mjs';
import {readUpstashMonitoring} from '../../../lib/upstash-monitoring.mjs';
import {readVercelTraffic} from '../../../lib/vercel-traffic.mjs';
import {NextResponse} from 'next/server';
import {getProviderConfig} from '../../../lib/provider-config.mjs';
import {readProviderMonitoring,readVercelCosts} from '../../../lib/monitoring-read.mjs';
import {createObservationCache} from '../../../lib/provider-cache.mjs';
import {responseHeaders} from '../../../lib/provider-read.mjs';
export const dynamic='force-dynamic';export const runtime='nodejs';export const maxDuration=30;
const observe=createObservationCache();
const costs=createObservationCache(3600000);
export async function GET(request){
 const p=new URL(request.url).searchParams,name=p.get('provider'),range=p.get('range')||'7d';
 if(!['Twilio','Google Maps Platform','Gemini / Google','Redis','Sentry','Cloudflare','PostHog','Vercel'].includes(name)||!['24h','7d'].includes(range))return NextResponse.json({status:'invalid-request'},{status:400,headers:responseHeaders});
 try{const env=await getProviderConfig();const result=await observe(name+range,async()=>{if(name==='Twilio')return readTwilioMonitoring(env,range);if(['Google Maps Platform','Gemini / Google'].includes(name))return readGoogleMonitoring(name,range,{...env,AWS_ACCESS_KEY_ID:process.env.AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY:process.env.AWS_SECRET_ACCESS_KEY,AWS_SESSION_TOKEN:process.env.AWS_SESSION_TOKEN});if(name==='Redis')return readUpstashMonitoring(env,range);if(name!=='Vercel')return readProviderMonitoring(name,range,env);const [traffic,cost]=await Promise.all([readVercelTraffic(env,range),costs('vercel-cost',()=>readVercelCosts(env))]);return {...traffic,cost};});return NextResponse.json(result,{headers:responseHeaders});}catch{return NextResponse.json({status:'unavailable',series:[],reason:'Monitoring credentials could not be loaded.'},{status:503,headers:responseHeaders});}
}
