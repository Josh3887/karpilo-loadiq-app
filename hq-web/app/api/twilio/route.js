import {getProviderConfig} from '../../../lib/provider-config.mjs';
import {NextResponse} from 'next/server';
import {readTwilio} from '../../../lib/twilio-read.mjs';
import {createObservationCache} from '../../../lib/provider-cache.mjs';
const observe=createObservationCache();
import {responseHeaders} from '../../../lib/provider-read.mjs';
export const runtime='nodejs';
export const maxDuration=30;
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json(await observe('twilio',async()=>{const r=await readTwilio(await getProviderConfig());return {...r,usage:null,messages:null,verifyServices:r.verifyServices?.filter(s=>/loadiq|load iq/i.test(s.name))??null,coverage:{...r.coverage,usage:'product-attribution-unavailable',messages:'product-attribution-unavailable'},reason:'Shared Twilio account access is verified separately. Only LoadIQ-named Verify services are displayed. Product message attribution and product billing are not configured; account-wide usage and delivery history are excluded.'}}),{headers:responseHeaders})}catch{return NextResponse.json({status:'error',reason:'Provider credential store unavailable'},{status:503,headers:responseHeaders})}}
