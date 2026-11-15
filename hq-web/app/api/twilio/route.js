import {NextResponse} from 'next/server';
import {readTwilio} from '../../../lib/twilio-read.mjs';
import {responseHeaders} from '../../../lib/provider-read.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json(await readTwilio(),{headers:responseHeaders});}
