import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json({status:'unconfigured',scope:'LoadIQ',services:null,total:null,reason:'Product cost allocation is not configured. Company-wide Cost Explorer totals are excluded.'},{headers:{'Cache-Control':'private, no-store'}})}
