import {getProviderConfig} from '../../../lib/provider-config.mjs';
import {NextResponse} from 'next/server';
import {readTwilio} from '../../../lib/twilio-read.mjs';
import {responseHeaders} from '../../../lib/provider-read.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json(await readTwilio(await getProviderConfig()),{headers:responseHeaders})}catch{return NextResponse.json({status:'error',reason:'Provider credential store unavailable'},{status:503,headers:responseHeaders})}}
