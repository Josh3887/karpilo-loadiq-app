import {NextResponse} from 'next/server';
import {STSClient,GetCallerIdentityCommand} from '@aws-sdk/client-sts';
import {ECSClient,ListServicesCommand,DescribeServicesCommand} from '@aws-sdk/client-ecs';
import {RDSClient,DescribeDBInstancesCommand} from '@aws-sdk/client-rds';
import {LambdaClient,ListFunctionsCommand} from '@aws-sdk/client-lambda';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 if(!process.env.AWS_ACCESS_KEY_ID||!process.env.AWS_SECRET_ACCESS_KEY)return NextResponse.json({status:'unconfigured',services:[],database:[],functions:[]},{headers:{'Cache-Control':'private, no-store'}});
 const region=process.env.AWS_REGION||'us-east-2';
 try{
  const [identity,serviceList,databases,functions]=await Promise.all([
   new STSClient({region}).send(new GetCallerIdentityCommand({})),
   new ECSClient({region}).send(new ListServicesCommand({cluster:'karpilo-isolated-test'})),
   new RDSClient({region}).send(new DescribeDBInstancesCommand({})),
   new LambdaClient({region}).send(new ListFunctionsCommand({maxItems:50}))
  ]);
  const services=(serviceList.serviceArns||[]).length?await new ECSClient({region}).send(new DescribeServicesCommand({cluster:'karpilo-isolated-test',services:serviceList.serviceArns})):null;
  return NextResponse.json({status:'connected',accountId:identity.Account,region,
   services:(services?.services||[]).map(s=>({name:s.serviceName,status:s.status,desired:s.desiredCount,running:s.runningCount})),
   database:(databases.DBInstances||[]).map(d=>({name:d.DBInstanceIdentifier,status:d.DBInstanceStatus,engine:d.Engine})),
   functions:(functions.Functions||[]).map(f=>({name:f.FunctionName,runtime:f.Runtime})),
   checkedAt:new Date().toISOString()
  },{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return NextResponse.json({status:'error',errorCode:e.name||'AWS_READ_FAILED',services:[],database:[],functions:[]},{status:502,headers:{'Cache-Control':'private, no-store'}})}
}
