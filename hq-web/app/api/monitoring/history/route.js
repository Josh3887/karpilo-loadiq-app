import {NextResponse} from 'next/server';
import {readHistory} from '../../../../lib/monitor-history.mjs';
import {createObservationCache} from '../../../../lib/provider-cache.mjs';
export const dynamic='force-dynamic';export const runtime='nodejs';export const maxDuration=15;
const observe=createObservationCache(30000);
export async function GET(){return NextResponse.json(await observe('history',()=>readHistory()),{headers:{'Cache-Control':'private, no-store'}})}
