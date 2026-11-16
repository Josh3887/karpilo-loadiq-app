import {NextResponse} from 'next/server';
import {getProviderConfig} from '../../../lib/provider-config.mjs';
import {createObservationCache} from '../../../lib/provider-cache.mjs';
import {readCloudflare} from '../../../lib/cloudflare-read.mjs';
import {responseHeaders} from '../../../lib/provider-read.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
const observe=createObservationCache();
export async function GET(){
 try{
  const config=await getProviderConfig();
  return NextResponse.json(await observe('cloudflare',()=>readCloudflare(config)),{headers:responseHeaders});
 }catch{
  return NextResponse.json({status:'error',reason:'Provider credential store unavailable'},{status:503,headers:responseHeaders});
 }
}
