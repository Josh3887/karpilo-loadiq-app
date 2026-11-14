import {NextResponse} from 'next/server';
import {CostExplorerClient,GetCostAndUsageCommand} from '@aws-sdk/client-cost-explorer';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){
 if(!process.env.AWS_ACCESS_KEY_ID||!process.env.AWS_SECRET_ACCESS_KEY)return NextResponse.json({status:'unconfigured',services:[]},{headers:{'Cache-Control':'private, no-store'}});
 const end=new Date(),start=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),1));
 const iso=d=>d.toISOString().slice(0,10);
 const endExclusive=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate()+1));
 try{
 const client=new CostExplorerClient({region:'us-east-1'});
 const groups=[];
 let token;
 let pages=0;
 do {
  const response=await client.send(new GetCostAndUsageCommand({TimePeriod:{Start:iso(start),End:iso(endExclusive)},Granularity:'MONTHLY',Metrics:['UnblendedCost'],GroupBy:[{Type:'DIMENSION',Key:'SERVICE'}],...(token?{NextPageToken:token}:{})}));
  groups.push(...(response.ResultsByTime||[]));
  token=response.NextPageToken;
  pages++;
 } while(token&&pages<20);
 const services=groups.flatMap(x=>(x.Groups||[]).map(g=>({name:g.Keys?.[0]||'Unknown AWS service',amount:Number(g.Metrics?.UnblendedCost?.Amount||0),currency:g.Metrics?.UnblendedCost?.Unit||'USD',estimated:!!x.Estimated})));
 return NextResponse.json({status:'connected',source:'AWS Cost Explorer',periodStart:iso(start),periodEndExclusive:iso(endExclusive),services,total:services.reduce((n,x)=>n+x.amount,0),currency:'USD',partial:!!token,checkedAt:new Date().toISOString()},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return NextResponse.json({status:'error',errorCode:e.name||'COST_EXPLORER_READ_FAILED',services:[]},{status:502,headers:{'Cache-Control':'private, no-store'}})}
}
