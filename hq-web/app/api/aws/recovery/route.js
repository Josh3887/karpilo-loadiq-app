import {NextResponse} from 'next/server';
import {RDSClient,DescribeDBInstancesCommand,DescribeDBSnapshotsCommand} from '@aws-sdk/client-rds';
import {ECSClient,ListTasksCommand,DescribeTasksCommand} from '@aws-sdk/client-ecs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){
 if(!process.env.AWS_ACCESS_KEY_ID||!process.env.AWS_SECRET_ACCESS_KEY)return NextResponse.json({status:'unconfigured',databases:[],snapshots:[],tasks:[]},{headers});
 const region=process.env.AWS_REGION||'us-east-2';
 try{
  const rds=new RDSClient({region}),ecs=new ECSClient({region});
  const [dbs,snaps,taskList]=await Promise.all([
   rds.send(new DescribeDBInstancesCommand({DBInstanceIdentifier:'karpilo-isolated-test'})),
   rds.send(new DescribeDBSnapshotsCommand({DBInstanceIdentifier:'karpilo-isolated-test',MaxRecords:100})),
   ecs.send(new ListTasksCommand({cluster:'karpilo-isolated-test'}))
  ]);
  const taskArns=taskList.taskArns||[];
  const tasks=taskArns.length?await ecs.send(new DescribeTasksCommand({cluster:'karpilo-isolated-test',tasks:taskArns})):null;
  return NextResponse.json({status:'connected',region,
   databases:(dbs.DBInstances||[]).map(d=>({name:d.DBInstanceIdentifier,status:d.DBInstanceStatus,backupRetentionDays:d.BackupRetentionPeriod,latestRestorableTime:d.LatestRestorableTime?.toISOString()||null,encrypted:d.StorageEncrypted,deletionProtection:d.DeletionProtection,multiAZ:d.MultiAZ,publiclyAccessible:d.PubliclyAccessible})),
   snapshots:(snaps.DBSnapshots||[]).map(s=>({id:s.DBSnapshotIdentifier,type:s.SnapshotType,status:s.Status,createdAt:s.SnapshotCreateTime?.toISOString()||null,encrypted:s.Encrypted})),
   tasks:(tasks?.tasks||[]).map(t=>({service:t.group,status:t.lastStatus,desired:t.desiredStatus,health:t.healthStatus||'UNKNOWN',startedAt:t.startedAt?.toISOString()||null})),
   partial:!!(snaps.Marker||taskList.nextToken),checkedAt:new Date().toISOString()
  },{headers});
 }catch(e){return NextResponse.json({status:'error',errorCode:e.name||'RECOVERY_READ_FAILED',databases:[],snapshots:[],tasks:[]},{status:502,headers})}
}
