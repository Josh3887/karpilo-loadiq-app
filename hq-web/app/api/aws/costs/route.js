import {NextResponse} from 'next/server';
import {CostExplorerClient,GetCostAndUsageCommand} from '@aws-sdk/client-cost-explorer';
import {costRequest,normalizeCosts} from '../../../../lib/aws-costs.mjs';
import {createObservationCache} from '../../../../lib/provider-cache.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
const cached=createObservationCache(3600000);
export async function GET(){
 const result=await cached('loadiq-month-costs',async()=>{
  if(!process.env.AWS_ACCESS_KEY_ID||!process.env.AWS_SECRET_ACCESS_KEY)return {status:'unconfigured',total:null,series:[],reason:'AWS billing credentials are unavailable.'};
  const request=costRequest();
  if(request.TimePeriod.Start===request.TimePeriod.End)return {status:'connected-empty',total:null,series:[],reason:'No complete UTC day in this billing month yet.'};
  try{
   const response=await new CostExplorerClient({region:'us-east-1',maxAttempts:1}).send(new GetCostAndUsageCommand(request),{abortSignal:AbortSignal.timeout(20000)});
   const normalized=normalizeCosts(response,request);
   // Empty allocation is a successful read, but must never become a zero bill.
   return ['connected','connected-empty'].includes(normalized.status)?{status:'connected',value:normalized}:normalized;
  }catch(e){return {status:/AccessDenied|Unauthorized/.test(e.name)?'access-denied':'unavailable',total:null,series:[],reason:'AWS product cost read failed. No account-wide fallback or inferred bill is shown.'};}
 });
 return NextResponse.json(result.value||result,{headers:{'Cache-Control':'private, no-store'}});
}
