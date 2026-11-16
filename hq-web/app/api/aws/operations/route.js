import {NextResponse} from 'next/server';
import {CloudWatchClient,DescribeAlarmsCommand} from '@aws-sdk/client-cloudwatch';
import {EventBridgeClient,ListRulesCommand} from '@aws-sdk/client-eventbridge';
import {CloudWatchLogsClient,DescribeLogGroupsCommand} from '@aws-sdk/client-cloudwatch-logs';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){
 if(!process.env.AWS_ACCESS_KEY_ID||!process.env.AWS_SECRET_ACCESS_KEY)return NextResponse.json({status:'unconfigured',alarms:[],rules:[],logGroups:[]},{headers:{'Cache-Control':'private, no-store'}});
 const region=process.env.AWS_REGION||'us-east-2';
 try{
 const [alarms,rules,logs]=await Promise.all([
 new CloudWatchClient({region}).send(new DescribeAlarmsCommand({MaxRecords:100})),
 new EventBridgeClient({region}).send(new ListRulesCommand({Limit:100})),
 new CloudWatchLogsClient({region}).send(new DescribeLogGroupsCommand({limit:50}))
 ]);
 return NextResponse.json({status:'connected',region,
 alarms:(alarms.MetricAlarms||[]).map(a=>({name:a.AlarmName,state:a.StateValue,metric:a.MetricName||null})).concat((alarms.CompositeAlarms||[]).map(a=>({name:a.AlarmName,state:a.StateValue,metric:null}))),
 rules:(rules.Rules||[]).filter(r=>r.Name?.includes('Karpilo')||r.Name?.includes('LoadIQ')).map(r=>({name:r.Name,state:r.State,schedule:r.ScheduleExpression||null})),
 logGroups:(logs.logGroups||[]).filter(l=>l.logGroupName?.includes('karpilo')||l.logGroupName?.includes('Karpilo')).map(l=>({name:l.logGroupName,retentionDays:l.retentionInDays??null})),
 partial:!!(alarms.NextToken||rules.NextToken||logs.nextToken),checkedAt:new Date().toISOString()
 },{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return NextResponse.json({status:'error',errorCode:e.name||'OPERATIONS_READ_FAILED',alarms:[],rules:[],logGroups:[]},{status:502,headers:{'Cache-Control':'private, no-store'}})}
}
