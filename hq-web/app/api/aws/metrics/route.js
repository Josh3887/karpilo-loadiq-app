import {NextResponse} from 'next/server';
import {CloudWatchClient,GetMetricDataCommand} from '@aws-sdk/client-cloudwatch';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
const services=['karpilo-isolated-test','karpilo-billing-workers','karpilo-enrollment-worker'];
export async function GET(request){
 const range=new URL(request.url).searchParams.get('range')||'24h';
 const hours=range==='7d'?168:range==='1h'?1:24;
 if(!process.env.AWS_ACCESS_KEY_ID||!process.env.AWS_SECRET_ACCESS_KEY)return NextResponse.json({status:'unconfigured',metrics:[]},{headers:{'Cache-Control':'private, no-store'}});
 const region=process.env.AWS_REGION||'us-east-2';
 const end=new Date(),start=new Date(end.getTime()-hours*60*60*1000);
 const queries=services.flatMap((service,i)=>[
  {Id:'cpu'+i,MetricStat:{Metric:{Namespace:'AWS/ECS',MetricName:'CPUUtilization',Dimensions:[{Name:'ClusterName',Value:'karpilo-isolated-test'},{Name:'ServiceName',Value:service}]},Period:hours>24?3600:300,Stat:'Average'},ReturnData:true},
  {Id:'mem'+i,MetricStat:{Metric:{Namespace:'AWS/ECS',MetricName:'MemoryUtilization',Dimensions:[{Name:'ClusterName',Value:'karpilo-isolated-test'},{Name:'ServiceName',Value:service}]},Period:hours>24?3600:300,Stat:'Average'},ReturnData:true}
 ]).concat([{Id:'rdscpu',MetricStat:{Metric:{Namespace:'AWS/RDS',MetricName:'CPUUtilization',Dimensions:[{Name:'DBInstanceIdentifier',Value:'karpilo-isolated-test'}]},Period:hours>24?3600:300,Stat:'Average'},ReturnData:true},{Id:'rdsconnections',MetricStat:{Metric:{Namespace:'AWS/RDS',MetricName:'DatabaseConnections',Dimensions:[{Name:'DBInstanceIdentifier',Value:'karpilo-isolated-test'}]},Period:hours>24?3600:300,Stat:'Average'},ReturnData:true},{Id:'rdsstorage',MetricStat:{Metric:{Namespace:'AWS/RDS',MetricName:'FreeStorageSpace',Dimensions:[{Name:'DBInstanceIdentifier',Value:'karpilo-isolated-test'}]},Period:hours>24?3600:300,Stat:'Average'},ReturnData:true},{Id:'lambdaerrors',MetricStat:{Metric:{Namespace:'AWS/Lambda',MetricName:'Errors',Dimensions:[{Name:'FunctionName',Value:'KarpiloLoadIQIsolatedDailyHealth'}]},Period:hours>24?3600:300,Stat:'Sum'},ReturnData:true}]);
 try{
  const result=await new CloudWatchClient({region}).send(new GetMetricDataCommand({MetricDataQueries:queries,StartTime:start,EndTime:end,ScanBy:'TimestampDescending',MaxDatapoints:10000}),{abortSignal:AbortSignal.timeout(20000)});
  const metrics=(result.MetricDataResults||[]).map(m=>({id:m.Id,service:m.Id.startsWith('rds')?'karpilo-isolated-test RDS':m.Id==='lambdaerrors'?'KarpiloLoadIQIsolatedDailyHealth':services[Number(m.Id.slice(3))],metric:m.Id==='rdscpu'?'CPUUtilization':m.Id==='rdsconnections'?'DatabaseConnections':m.Id==='rdsstorage'?'FreeStorageSpace':m.Id==='lambdaerrors'?'Errors':m.Id.startsWith('cpu')?'CPUUtilization':'MemoryUtilization',unit:m.Id==='rdsstorage'?'bytes':m.Id==='rdsconnections'?'connections':m.Id==='lambdaerrors'?'errors':'percent',value:m.Values?.[0]??null,timestamp:m.Timestamps?.[0]?.toISOString()??null,status:m.StatusCode,points:(m.Timestamps||[]).map((t,i)=>({time:t.toISOString(),value:m.Values?.[i]})).filter(p=>Number.isFinite(p.value)).sort((a,b)=>Date.parse(a.time)-Date.parse(b.time))}));
  return NextResponse.json({status:result.NextToken||metrics.some(m=>m.status!=='Complete')?'partial':'connected',checkedAt:new Date().toISOString(),region,windowStart:start.toISOString(),windowEnd:end.toISOString(),metrics,partial:!!result.NextToken},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return NextResponse.json({status:'error',errorCode:e.name||'METRICS_READ_FAILED',metrics:[]},{status:502,headers:{'Cache-Control':'private, no-store'}})}
}
