import {NextResponse} from 'next/server';
import {getProviderConfig} from '../../../lib/provider-config.mjs';
import {readProviderMonitoring,readVercelCosts} from '../../../lib/monitoring-read.mjs';
import {createObservationCache} from '../../../lib/provider-cache.mjs';
import {responseHeaders} from '../../../lib/provider-read.mjs';
export const dynamic='force-dynamic';export const runtime='nodejs';export const maxDuration=30;
const observe=createObservationCache();
export async function GET(request){
 const p=new URL(request.url).searchParams,name=p.get('provider'),range=p.get('range')||'7d';
 if(!['Sentry','Cloudflare','PostHog','Vercel'].includes(name)||!['24h','7d'].includes(range))return NextResponse.json({status:'invalid-request'},{status:400,headers:responseHeaders});
 try{const env=await getProviderConfig();const result=await observe(name+range,()=>name==='Vercel'?readVercelCosts(env):readProviderMonitoring(name,range,env));return NextResponse.json(result,{headers:responseHeaders});}catch{return NextResponse.json({status:'unavailable',series:[],reason:'Monitoring credentials could not be loaded.'},{status:503,headers:responseHeaders});}
}
