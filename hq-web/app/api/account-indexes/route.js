import {NextResponse} from 'next/server';
import {ACCOUNT_INDEXES,accountIndexCoverage} from '../../../lib/account-indexes.js';
export const dynamic='force-dynamic';
export async function GET(){
 const indexes=Object.keys(ACCOUNT_INDEXES).map(accountIndexCoverage);
 return NextResponse.json({status:'unconfigured',reason:'Account database connection and founder authorization pending. No customer records accessed.',indexes,generatedAt:new Date().toISOString()},{headers:{'Cache-Control':'private, no-store'}});
}
