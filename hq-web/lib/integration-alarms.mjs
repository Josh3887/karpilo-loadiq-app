const failures=new Set(['error','unavailable','access-denied','rate-limited']);
export function integrationAlarms({entries=[],awsOperations,posthog,sentry,resend,twilio},now=Date.now()){
 const alarms=[];
 const add=(id,provider,severity,title,detail,observedAt)=>alarms.push({id,provider,severity,title,detail,observedAt:observedAt||null});
 for(const p of entries){
  if(failures.has(p.status))add('connection-'+p.name,p.name,'critical','Connection requires attention',p.status+' · Last API check failed; this does not prove a service outage.',p.checkedAt);
  else if(p.status==='partial')add('partial-'+p.name,p.name,'warning','Some data is unavailable','One or more provider scopes could not be read.',p.checkedAt);
  const age=now-Date.parse(p.checkedAt);
  if(p.status==='connected'&&Number.isFinite(age)&&age>15*60000)add('stale-'+p.name,p.name,'warning','Observation is stale','Last check is older than 15 minutes. Refresh services to recheck.',p.checkedAt);
 }
 if(awsOperations?.status==='connected')for(const a of awsOperations.alarms||[]){
  if(a.state==='ALARM'||a.state==='INSUFFICIENT_DATA')add('aws-'+a.name,'AWS',a.state==='ALARM'?'critical':'warning',a.state==='ALARM'?'CloudWatch alarm':'CloudWatch needs data',a.name+(a.metric?' · '+a.metric:''),awsOperations.checkedAt);
 }
 else if(awsOperations?.status&&awsOperations.status!=='loading')add('aws-monitoring','AWS','warning','Alarm feed unavailable','CloudWatch alarm state could not be verified.',awsOperations.checkedAt);
 if(posthog?.project?.ingestedEvent===false)add('posthog-ingestion','PostHog','warning','No events received','Project '+posthog.project.id+' reports no event ingestion. API access is connected; collection still needs verification.',posthog.checkedAt);
 if(sentry?.issues?.length)add('sentry-issues','Sentry','warning','Unresolved issues',sentry.issues.length+' returned in the 14-day inventory'+(sentry.pagination?.issues?' (more pages exist)':'')+'. Review in Sentry; these are not necessarily new incidents.',sentry.checkedAt);
 for(const d of resend?.domains||[])if(d.status==='failed')add('resend-'+d.id,'Resend','warning','Sender domain failed',d.name+' · Provider verification failed. DNS has not been changed.',resend.checkedAt);
 const failedMessages=twilio?.messages?.filter(m=>['failed','undelivered'].includes(m.status))||[];
 if(failedMessages.length)add('twilio-delivery','Twilio','warning','Delivery failures in history',failedMessages.length+' failed or undelivered messages in the bounded history. Historical records, not a current outage.',twilio.checkedAt);
 return alarms.sort((a,b)=>({critical:0,warning:1}[a.severity]-{critical:0,warning:1}[b.severity]));
}
