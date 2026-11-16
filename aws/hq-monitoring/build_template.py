import json,pathlib
root=pathlib.Path(__file__).parent
arn='arn:aws:secretsmanager:us-east-2:337058058945:secret:karpilo-hq-web/provider-readonly-r3QBk8'
policy=lambda statements:{'Version':'2012-10-17','Statement':statements}
allow=lambda actions,resource:{'Effect':'Allow','Action':actions,'Resource':resource}
trust=lambda service:policy([{'Effect':'Allow','Principal':{'Service':service},'Action':'sts:AssumeRole'}])
r={
 'History':{'Type':'AWS::DynamoDB::Table','DeletionPolicy':'Retain','UpdateReplacePolicy':'Retain','Properties':{'TableName':'karpilo-hq-monitoring-history','BillingMode':'PAY_PER_REQUEST','AttributeDefinitions':[{'AttributeName':x,'AttributeType':'S'} for x in ['pk','sk']],'KeySchema':[{'AttributeName':'pk','KeyType':'HASH'},{'AttributeName':'sk','KeyType':'RANGE'}],'TimeToLiveSpecification':{'AttributeName':'expiresAt','Enabled':True},'SSESpecification':{'SSEEnabled':True},'Tags':[{'Key':'Application','Value':'LoadIQ-HQ'}]}},
 'Logs':{'Type':'AWS::Logs::LogGroup','Properties':{'LogGroupName':'/aws/lambda/karpilo-hq-monitor','RetentionInDays':14}},
 'DeadLetters':{'Type':'AWS::SQS::Queue','Properties':{'QueueName':'karpilo-hq-monitor-dlq','MessageRetentionPeriod':1209600,'SqsManagedSseEnabled':True}},
 'CollectorRole':{'Type':'AWS::IAM::Role','Properties':{'AssumeRolePolicyDocument':trust('lambda.amazonaws.com'),'Policies':[{'PolicyName':'MonitorOnly','PolicyDocument':policy([allow(['secretsmanager:GetSecretValue'],arn),allow(['dynamodb:PutItem'],{'Fn::GetAtt':['History','Arn']}),allow(['logs:CreateLogStream','logs:PutLogEvents'],{'Fn::GetAtt':['Logs','Arn']}),allow(['sqs:SendMessage'],{'Fn::GetAtt':['DeadLetters','Arn']})])}]}},
 'Collector':{'Type':'AWS::Lambda::Function','Properties':{'FunctionName':'karpilo-hq-monitor','Runtime':'python3.13','Handler':'index.handler','MemorySize':128,'Timeout':45,'Role':{'Fn::GetAtt':['CollectorRole','Arn']},'Code':{'ZipFile':(root/'collector.py').read_text()},'Environment':{'Variables':{'TABLE':{'Ref':'History'},'SECRET_ARN':arn}},'DeadLetterConfig':{'TargetArn':{'Fn::GetAtt':['DeadLetters','Arn']}},'Tags':[{'Key':'Application','Value':'LoadIQ-HQ'}]}},
 'SchedulerRole':{'Type':'AWS::IAM::Role','Properties':{'AssumeRolePolicyDocument':trust('scheduler.amazonaws.com'),'Policies':[{'PolicyName':'InvokeMonitorOnly','PolicyDocument':policy([allow(['lambda:InvokeFunction'],{'Fn::GetAtt':['Collector','Arn']}),allow(['sqs:SendMessage'],{'Fn::GetAtt':['DeadLetters','Arn']})])}]}},
 'Schedule':{'Type':'AWS::Scheduler::Schedule','Properties':{'Name':'karpilo-hq-monitor-five-minute','ScheduleExpression':'rate(5 minutes)','FlexibleTimeWindow':{'Mode':'OFF'},'State':'ENABLED','Target':{'Arn':{'Fn::GetAtt':['Collector','Arn']},'RoleArn':{'Fn::GetAtt':['SchedulerRole','Arn']},'Input':'{}','RetryPolicy':{'MaximumRetryAttempts':1,'MaximumEventAgeInSeconds':300},'DeadLetterConfig':{'Arn':{'Fn::GetAtt':['DeadLetters','Arn']}}}}},
 'HQReadPolicy':{'Type':'AWS::IAM::Policy','Properties':{'PolicyName':'HQMonitoringHistoryRead','Users':['karpilo-hq-preview-readonly'],'PolicyDocument':policy([allow(['dynamodb:Query'],{'Fn::GetAtt':['History','Arn']})])}}
}
# History was retained by the initial stack rollback; reuse it explicitly.
r.pop('History')
r['Collector']['Properties']['Environment']['Variables']['TABLE']='karpilo-hq-monitoring-history'
for resource in ('CollectorRole','HQReadPolicy'):
    props=r[resource]['Properties']
    policies=props.get('Policies',[{'PolicyDocument':props.get('PolicyDocument')}])
    for pol in policies:
        for statement in pol['PolicyDocument']['Statement']:
            if statement['Resource']=={'Fn::GetAtt':['History','Arn']}:
                statement['Resource']='arn:aws:dynamodb:us-east-2:337058058945:table/karpilo-hq-monitoring-history'
(root/'stack.json').write_text(json.dumps({'AWSTemplateFormatVersion':'2010-09-09','Description':'LoadIQ HQ read-only provider monitoring and 30-day history','Resources':r},indent=2)+'\n')
