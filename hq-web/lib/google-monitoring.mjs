import {SignatureV4} from '@smithy/signature-v4';
import {Sha256} from '@aws-crypto/sha256-js';
import {readJSON} from './provider-read.mjs';
export const GOOGLE_PROJECT='gen-lang-client-0079060133';
export const GOOGLE_AUDIENCE='//iam.googleapis.com/projects/78844481981/locations/global/workloadIdentityPools/loadiq-hq/providers/hq-aws';
export const LOADIQ_CREDENTIAL='apikey:3f4dea78-1edb-4ea7-9a14-440a382eb90d';
const services=['addressvalidation.googleapis.com','places.googleapis.com','routes.googleapis.com'];
export async function googleToken(env,fetcher=fetch){
 if(env.HQ_GOOGLE_MONITORING_ENABLED!=='true'||!env.AWS_ACCESS_KEY_ID||!env.AWS_SECRET_ACCESS_KEY)return null;
 const signer=new SignatureV4({service:'sts',region:'us-east-2',sha256:Sha256,credentials:{accessKeyId:env.AWS_ACCESS_KEY_ID,secretAccessKey:env.AWS_SECRET_ACCESS_KEY,...(env.AWS_SESSION_TOKEN?{sessionToken:env.AWS_SESSION_TOKEN}:{})}});
 const host='sts.us-east-2.amazonaws.com';
 const signed=await signer.sign({method:'POST',protocol:'https:',hostname:host,path:'/',query:{Action:'GetCallerIdentity',Version:'2011-06-15'},headers:{host,'x-goog-cloud-target-resource':GOOGLE_AUDIENCE}});
 const subjectToken=encodeURIComponent(JSON.stringify({url:'https://'+host+'/?Action=GetCallerIdentity&Version=2011-06-15',method:'POST',headers:Object.entries(signed.headers).map(([key,value])=>({key,value}))}));
 const r=await fetcher('https://sts.googleapis.com/v1/token',{method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json'},body:JSON.stringify({audience:GOOGLE_AUDIENCE,grantType:'urn:ietf:params:oauth:grant-type:token-exchange',requestedTokenType:'urn:ietf:params:oauth:token-type:access_token',subjectTokenType:'urn:ietf:params:aws:token-type:aws4_request',scope:'https://www.googleapis.com/auth/monitoring.read',subjectToken})});
 if(!r.ok){const body=await r.json().catch(()=>({}));const allowed=['invalid_request','invalid_grant','invalid_target','unauthorized_client','access_denied'];const error=Error('Google monitoring authorization unavailable');error.publicCode=allowed.includes(body.error)?body.error:'token_exchange_failed';error.httpStatus=r.status;throw error;}
 const body=await r.json();if(typeof body.access_token!=='string'||!body.access_token)throw Error('Google monitoring authorization unavailable');return body.access_token;
}
export function normalizeGoogleSeries(data){
 if(!data||typeof data!=='object'||Array.isArray(data)||data.nextPageToken||data.executionErrors?.length)return null;
 if(data.timeSeries===undefined)return [];
 if(!Array.isArray(data.timeSeries)||data.timeSeries.length>30)return null;
 const out=[];
 for(const s of data.timeSeries){
  const service=s.resource?.labels?.service,code=s.metric?.labels?.response_code_class;
  if(!services.includes(service)||!/^\dxx$/.test(code)||!Array.isArray(s.points)||s.points.length>169)return null;
  const points=s.points.map(p=>({time:p.interval?.endTime,value:typeof p.value?.int64Value==='string'&&/^\d+$/.test(p.value.int64Value)?Number(p.value.int64Value):NaN}));
  if(points.some(p=>!Number.isFinite(Date.parse(p.time))||!Number.isSafeInteger(p.value)||p.value<0))return null;
  out.push({name:service.replace('.googleapis.com','')+' · '+code,unit:'requests',description:'Hourly API requests attributed to the LoadIQ isolated-sandbox key. Includes tests; excludes other keys and is not website visitor traffic.',points:points.sort((a,b)=>Date.parse(a.time)-Date.parse(b.time))});
 }
 return out;
}
export async function readGoogleMonitoring(name,range,env,fetcher=fetch,tokenReader=googleToken,now=Date.now()){
 const base={checkedAt:new Date(now).toISOString(),series:[],scope:'LoadIQ isolated-sandbox credential',cost:{status:'unconfigured',reason:'Google billing export and product allocation are not configured. API request counts are not billed SKU units or an invoice.'}};
 if(name==='Gemini / Google')return {...base,status:'attribution-missing',reason:'The default Gemini key has not been verified as LoadIQ-only. Shared Gemini activity is excluded until product attribution is established.'};
 try{
 const token=await tokenReader(env,fetcher);if(!token)return {...base,status:'unconfigured',reason:'Google monitoring federation is prepared but read-only project access has not been activated.'};
 const end=new Date(Math.floor((now-180000)/3600000)*3600000),start=new Date(+end-(range==='24h'?1:7)*86400000);
 const filter='metric.type="serviceruntime.googleapis.com/api/request_count" AND resource.type="consumed_api" AND resource.labels.credential_id="'+LOADIQ_CREDENTIAL+'" AND ('+services.map(s=>'resource.labels.service="'+s+'"').join(' OR ')+')';
 const query=new URLSearchParams({filter,'interval.startTime':start.toISOString(),'interval.endTime':end.toISOString(),'aggregation.alignmentPeriod':'3600s','aggregation.perSeriesAligner':'ALIGN_SUM','aggregation.crossSeriesReducer':'REDUCE_SUM',view:'FULL',pageSize:'10000'});
 query.append('aggregation.groupByFields','resource.labels.service');query.append('aggregation.groupByFields','metric.labels.response_code_class');
 const r=await readJSON('https://monitoring.googleapis.com/v3/projects/'+GOOGLE_PROJECT+'/timeSeries?'+query,'Bearer '+token,fetcher,15000);
 if(r.status!=='connected')return {...base,status:r.status,reason:'Google monitoring read failed. Missing access or an API error is not zero usage.'};
 const series=normalizeGoogleSeries(r.data);if(series===null)return {...base,status:'unavailable',reason:'Google statistics were incomplete or malformed; no partial totals are displayed.'};
 return {...base,status:'connected',series,window:{start:start.toISOString(),end:end.toISOString()},reason:series.length?'LoadIQ-key API requests grouped by service and HTTP response class. Current incomplete hour and reporting delay excluded.':'Google returned no usage series for the LoadIQ key in this period. This does not verify customer traffic or a zero bill.'};
 }catch(error){return {...base,status:'unavailable',reason:'Google monitoring authentication or transport failed'+(error.publicCode?' ('+error.publicCode+', HTTP '+error.httpStatus+')':'')+'. Credentials and provider error bodies are withheld.'}}
}
