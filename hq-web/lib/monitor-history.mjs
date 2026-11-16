import {SignatureV4} from '@smithy/signature-v4';
import {Sha256} from '@aws-crypto/sha256-js';
export function normalizeHistory(data,now=Date.now()){
 if(!Array.isArray(data?.Items))throw Error('Invalid history');
 const snapshots=data.Items.map(item=>JSON.parse(item.payload?.S||'null')).filter(s=>s&&Number.isFinite(Date.parse(s.checkedAt))&&Array.isArray(s.observations));
 snapshots.sort((a,b)=>Date.parse(a.checkedAt)-Date.parse(b.checkedAt));
 const latest=snapshots.at(-1)||null,stale=!latest||now-Date.parse(latest.checkedAt)>900000;
 return {status:!latest?'awaiting-first-run':stale?'stale':'connected',latest,snapshots,partial:!!data.LastEvaluatedKey,intervalSeconds:300,retentionDays:30,reason:!latest?'No scheduled observations stored yet.':stale?'Collector history is older than 15 minutes. Do not treat last known results as current.':'Scheduled observations continue while HQ is closed. Latest 24 hours, bounded to 288 snapshots.'};
}
export async function readHistory(env=process.env,fetcher=fetch,now=Date.now()){
 if(!env.AWS_ACCESS_KEY_ID||!env.AWS_SECRET_ACCESS_KEY)return {status:'unconfigured',snapshots:[],reason:'AWS monitoring history credentials unavailable.'};
 const hostname='dynamodb.us-east-2.amazonaws.com';
 const body=JSON.stringify({TableName:'karpilo-hq-monitoring-history',KeyConditionExpression:'pk = :pk AND sk >= :start',ExpressionAttributeValues:{':pk':{S:'loadiq'},':start':{S:String(Math.floor((now-86400000)/1000)).padStart(12,'0')}},ScanIndexForward:false,Limit:288,ConsistentRead:true});
 const signer=new SignatureV4({credentials:{accessKeyId:env.AWS_ACCESS_KEY_ID,secretAccessKey:env.AWS_SECRET_ACCESS_KEY,...(env.AWS_SESSION_TOKEN?{sessionToken:env.AWS_SESSION_TOKEN}:{})},region:'us-east-2',service:'dynamodb',sha256:Sha256});
 try{
  const signed=await signer.sign({protocol:'https:',hostname,method:'POST',path:'/',headers:{host:hostname,'content-type':'application/x-amz-json-1.0','x-amz-target':'DynamoDB_20120810.Query'},body});
  const r=await fetcher('https://'+hostname+'/',{method:'POST',headers:signed.headers,body,signal:AbortSignal.timeout(8000),cache:'no-store',redirect:'error'});
  if(!r.ok)return {status:'unavailable',snapshots:[],reason:'Monitoring history read failed. No healthy state is inferred.'};
  return normalizeHistory(await r.json(),now);
 }catch{return {status:'unavailable',snapshots:[],reason:'Monitoring history could not be validated.'};}
}
