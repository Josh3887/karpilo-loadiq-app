import {NextResponse} from 'next/server';
import {CloudWatchClient,GetMetricDataCommand} from '@aws-sdk/client-cloudwatch';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const services=['karpilo-isolated-test','karpilo-billing-workers','karpilo-enrollment-worker'];
export async function GET(){
 if(!process.env.AWS_ACCESS_KEY_ID||!process.env.AWS_SECRET_ACCESS_KEY)return NextResponse.json({status:'unconfigured',metrics:[]},{headers:{'Cache-Control':'private, no-store'}});
 const region=process.env.AWS_REGION||'us-east-2';
 const end=new Date(),start=new Date(end.getTime()-60*60*1000);
 const queries=services.flatMap((service,i)=>[
  {Id:'cpu'+i,MetricStat:{Metric:{Namespace:'AWS/ECS',MetricName:'CPUUtilization',Dimensions:[{Name:'ClusterName',Value:'karpilo-isolated-test'},{Name:'ServiceName',Value:service}]},Period:300,Stat:'Average'},ReturnData:true},
  {Id:'mem'+i,MetricStat:{Metric:{Namespace:'AWS/ECS',MetricName:'MemoryUtilization',Dimensions:[{Name:'ClusterName',Value:'karpilo-isolated-test'},{Name:'ServiceName',Value:service}]},Period:300,Stat:'Average'},ReturnData:true}
 ]);
 try{
  const result=await new CloudWatchClient({region}).send(new GetMetricDataCommand({MetricDataQueries:queries,StartTime:start,EndTime:end,ScanBy:'TimestampDescending'}));
  const metrics=(result.MetricDataResults||[]).map(m=>({id:m.Id,service:services[Number(m.Id.slice(3))],metric:m.Id.startsWith('cpu')?'CPUUtilization':'MemoryUtilization',unit:'percent',value:m.Values?.[0]??null,timestamp:m.Timestamps?.[0]?.toISOString()??null,status:m.StatusCode}));
  return NextResponse.json({status:'connected',region,windowStart:start.toISOString(),windowEnd:end.toISOString(),metrics,partial:!!result.NextToken},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return NextResponse.json({status:'error',errorCode:e.name||'METRICS_READ_FAILED',metrics:[]},{status:502,headers:{'Cache-Control':'private, no-store'}})}
}
