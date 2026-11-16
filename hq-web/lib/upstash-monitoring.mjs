import {readJSON} from './provider-read.mjs';
export const DATABASE_ID='80fa0f76-9d8f-49eb-9f8b-0752a3e07848';
const numeric=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
export function normalizePoints(rows){
 if(!Array.isArray(rows)||rows.length>10080) return null;
 const points=rows.map(r=>{
  const raw=typeof r?.x==='string'?r.x:'';
  const time=Date.parse(raw.replace(/\.(\d{3})\d+/,'.$1').replace(' +0000 UTC','Z').replace(' ','T'));
  return Number.isFinite(time)&&numeric(r?.y)?{time:new Date(time).toISOString(),value:r.y}:null;
 });
 return points.some(p=>!p)?null:points.sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
}
export async function readUpstashMonitoring(env,range='7d',fetcher=fetch,now=Date.now()){
 const base={checkedAt:new Date(now).toISOString(),database:'karpilo-isolated-test',series:[],summary:[]};
 if(!env.UPSTASH_MANAGEMENT_EMAIL||!env.UPSTASH_MANAGEMENT_API_KEY)return {...base,status:'unconfigured',reason:'Redis PING is separate. Read-only Upstash management access is required for database usage history.'};
 const authorization='Basic '+Buffer.from(env.UPSTASH_MANAGEMENT_EMAIL+':'+env.UPSTASH_MANAGEMENT_API_KEY).toString('base64');
 const r=await readJSON('https://api.upstash.com/v2/redis/stats/'+DATABASE_ID+'?period='+(range==='24h'?'1d':'7d'),authorization,fetcher,12000);
 if(r.status!=='connected')return {...base,status:r.status,reason:'Upstash database statistics could not be read. No zero usage is inferred.'};
 const d=r.data;
 if(!d||typeof d!=='object'||Array.isArray(d))return {...base,status:'unavailable',reason:'Upstash returned an unexpected statistics response.'};
 const fields=[['dailyrequests','Daily requests','requests'],['connection_count','Open connections','connections'],['keyspace','Stored keys','keys'],['diskusage','Storage','bytes'],['bandwidths','Bandwidth','bytes']];
 let invalid=false;
 const series=fields.flatMap(([key,name,unit])=>{if(d[key]===undefined)return [];const points=normalizePoints(d[key]);if(!points){invalid=true;return []}return [{name,unit,points,description:'Provider-reported history for karpilo-isolated-test only. Missing periods are not filled with zeros.'}]});
 const summary=[['total_monthly_requests','Month-to-date requests','requests'],['total_monthly_bandwidth','Month-to-date bandwidth','bytes'],['current_storage','Current storage','bytes']].flatMap(([key,name,unit])=>numeric(d[key])?[{name,unit,value:d[key]}]:[]);
 return {...base,status:invalid?'partial':series.length||summary.length?'connected':'unavailable',series,summary,reason:'Isolated LoadIQ Redis database only. These readings include monitoring and test activity, not customer counts.',cost:{status:'units-unverified',reason:'Management statistics expose billing values, but their currency and scale have not been verified. No invoice total or plan allowance is inferred.'}};
}
