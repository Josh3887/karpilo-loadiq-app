import {readJSON} from './provider-read.mjs';
const TEAM='team_qLleecV2DYevc11UNiAprtSv';
export const surfaces=[['Website','prj_XNJG4uOo0nzHSb8yBVNhYdv9vRJf'],['HQ','prj_pacuzxyQu9EFASSrYJZzAN2ziKjT']];
export async function readVercelTraffic(env,range='24h',fetcher=fetch,now=Date.now()){
 const end=new Date(Math.floor(now/3600000)*3600000),start=new Date(end.getTime()-(range==='7d'?7:1)*86400000);
 const base={checkedAt:new Date(now).toISOString(),window:{start:start.toISOString(),end:end.toISOString()},series:[]};
 if(!env.VERCEL_TOKEN)return {...base,status:'unconfigured',reason:'Vercel traffic credentials unavailable.'};
 const results=await Promise.all(surfaces.map(async([name,id])=>{
  const body={metric:'vercel.request.count',aggregation:'sum',scope:{type:'project',ownerId:TEAM,projectIds:[id]},startTime:start.toISOString(),endTime:end.toISOString(),granularity:{hours:1},limit:168};
  const r=await readJSON('https://api.vercel.com/v2/observability/query?teamId='+TEAM,'Bearer '+env.VERCEL_TOKEN,(url,options)=>fetcher(url,{...options,method:'POST',headers:{...options.headers,'Content-Type':'application/json'},body:JSON.stringify(body)}),15000);
  if(r.status!=='connected')return {name,status:r.status};
  const rows=r.data?.data;
  if(!Array.isArray(rows)||rows.length>169||rows.some(x=>!Number.isFinite(Date.parse(x.timestamp))||typeof x.vercel_request_count_sum!=='number'||!Number.isFinite(x.vercel_request_count_sum)||x.vercel_request_count_sum<0))return {name,status:'unavailable'};
  return {name,status:'connected',series:{name:name+' HTTP requests',unit:'requests',description:'Project-scoped hourly edge requests, all deployment environments. Includes bots, assets and monitoring checks; not unique visitors or customer sessions. Current incomplete hour excluded.',points:rows.map(x=>({time:x.timestamp,value:x.vercel_request_count_sum})).sort((a,b)=>Date.parse(a.time)-Date.parse(b.time))}};
 }));
 const connected=results.filter(r=>r.status==='connected');
 return {...base,status:connected.length===surfaces.length?'connected':connected.length?'partial':'unavailable',coverage:results.map(({name,status})=>({name,status})),series:connected.map(r=>r.series),reason:connected.length===surfaces.length?'Website and HQ traffic are separate. Customer app traffic is hosted separately and is not inferred from either project.':'One or more project traffic reads failed. Missing project permissions or provider access must be resolved; no zero traffic is inferred.'};
}
