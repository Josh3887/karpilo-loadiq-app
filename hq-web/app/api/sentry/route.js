import {NextResponse} from 'next/server';
import {getProviderConfig} from '../../../lib/provider-config.mjs';
import {readSentry} from '../../../lib/sentry-read.mjs';
import {responseHeaders} from '../../../lib/provider-read.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
export async function GET(){
 try{return NextResponse.json(await readSentry(await getProviderConfig()),{headers:responseHeaders})}
 catch{return NextResponse.json({status:'error',reason:'Provider credential store unavailable'},{status:503,headers:responseHeaders})}
}
