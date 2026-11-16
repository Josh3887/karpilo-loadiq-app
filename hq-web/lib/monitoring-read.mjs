import {readJSON} from './provider-read.mjs';
export const HQ_PROJECT='prj_pacuzxyQu9EFASSrYJZzAN2ziKjT',TEAM='team_qLleecV2DYevc11UNiAprtSv';
export const period=(range,now=Date.now())=>({start:new Date(now-(range==='24h'?1:7)*86400000).toISOString(),end:new Date(now).toISOString()});
export const series=(name,unit,points,description)=>({name,unit,description,points:points.filter(p=>Number.isFinite(Date.parse(p.time))&&typeof p.value==='number'&&Number.isFinite(p.value)).sort((a,b)=>Date.parse(a.time)-Date.parse(b.time))});
const unavailable=(status,reason)=>({status,reason,series:[]});
export async function readProviderMonitoring(name,range,env,fetcher=fetch){
 const window=period(range),base={checkedAt:new Date().toISOString(),window,series:[]};
 if(name==='Sentry'){
  if(!env.SENTRY_AUTH_TOKEN)return {...base,...unavailable('unconfigured','Sentry API credentials are missing.')};
  const url='https://sentry.io/api/0/organizations/karpilo-endeavor-technologies/stats_v2/?project=4512353987133440&field=sum(quantity)&category=error&groupBy=outcome&interval=1h&start='+encodeURIComponent(window.start)+'&end='+encodeURIComponent(window.end);
  const r=await readJSON(url,'Bearer '+env.SENTRY_AUTH_TOKEN,fetcher,15000);
  if(r.status!=='connected')return {...base,...unavailable(r.status,'Sentry event-volume access failed. The internal integration needs organization read access to project-filtered stats.')};
  if(!Array.isArray(r.data?.intervals)||!Array.isArray(r.data?.groups))return {...base,...unavailable('unavailable','Sentry returned an unrecognized time-series response.')};
  return {...base,status:'connected',scope:'karpilo-loadiq-isolated · error events',series:r.data.groups.slice(0,10).map(g=>series('Error events · '+(g.by?.outcome||'unknown'),'events',r.data.intervals.map((time,i)=>({time,value:g.series?.['sum(quantity)']?.[i]})),'Provider error-event counts by outcome. Accepted events can still represent application errors.')),reason:'Hourly Sentry error-event volume, restricted to the LoadIQ isolated project. This does not include performance spans or billing.'};
 }
 if(name==='Cloudflare'){
  if(!env.CLOUDFLARE_API_TOKEN)return {...base,...unavailable('unconfigured','Cloudflare token is missing.')};
  const query='query($zone: String!, $start: Date!, $end: Date!){viewer{zones(filter:{zoneTag:$zone}){httpRequests1dGroups(limit:8,filter:{date_geq:$start,date_lt:$end},orderBy:[date_ASC]){dimensions{date} sum{requests bytes cachedRequests threats}}}}}';
  const r=await readJSON('https://api.cloudflare.com/client/v4/graphql','Bearer '+env.CLOUDFLARE_API_TOKEN,(url,options)=>fetcher(url,{...options,method:'POST',headers:{...options.headers,'Content-Type':'application/json'},body:JSON.stringify({query,variables:{zone:'354a61884ea0777e1c8a1a8f01b8aa8a',start:window.start.slice(0,10),end:window.end.slice(0,10)}})}),15000);
  if(r.status!=='connected')return {...base,...unavailable(r.status,'Cloudflare analytics could not be read. The zone token needs Zone Analytics:Read for karpilo-liq.com; DNS permission alone is insufficient.')};
  if(r.data?.errors?.length){const denied=r.data.errors.some(e=>/not authorized|permission|access denied|forbidden/i.test(e?.message||''));return {...base,...unavailable(denied?'access-denied':'unavailable',denied?'The Cloudflare token needs Zone Analytics:Read for karpilo-liq.com.':'Cloudflare rejected the analytics query. No traffic total is inferred.')};}
  const rows=r.data?.data?.viewer?.zones?.[0]?.httpRequests1dGroups;
  if(!Array.isArray(rows))return {...base,...unavailable('unavailable','No validated Cloudflare analytics dataset returned.')};
  return {...base,status:'connected',scope:'karpilo-liq.com · complete UTC days',series:[['requests','HTTP requests','requests'],['bytes','Traffic delivered','bytes'],['cachedRequests','Cached requests','requests'],['threats','Threats reported','requests']].map(([key,label,unit])=>series(label,unit,rows.map(x=>({time:x.dimensions.date,value:x.sum[key]})),'Daily zone analytics. DNS-only hosts do not produce proxied HTTP traffic.')),reason:'Cloudflare daily analytics excludes today’s incomplete UTC day. Empty data is not an uptime guarantee.'};
 }
 if(name==='PostHog'){
  if(env.POSTHOG_PROJECT_ID!=='447918'||env.POSTHOG_HOST?.replace(/\/$/,'')!=='https://us.posthog.com'||!env.POSTHOG_PERSONAL_API_KEY)return {...base,...unavailable('unconfigured','PostHog must be configured for the verified LoadIQ project.')};
  const days=range==='24h'?1:7;
  const r=await readJSON('https://us.posthog.com/api/projects/447918/query/','Bearer '+env.POSTHOG_PERSONAL_API_KEY,(url,options)=>fetcher(url,{...options,method:'POST',headers:{...options.headers,'Content-Type':'application/json'},body:JSON.stringify({query:{kind:'HogQLQuery',query:`SELECT toStartOfHour(timestamp) AS hour, count() AS events FROM events WHERE timestamp >= now() - INTERVAL ${days} DAY GROUP BY hour ORDER BY hour LIMIT 168`}})}),18000);
  if(r.status!=='connected')return {...base,...unavailable(r.status,'PostHog event trends require query:read on project 447918. The current inventory key may not include that permission.')};
  if(!Array.isArray(r.data?.results))return {...base,...unavailable('unavailable','PostHog query result is not available yet.')};
  return {...base,status:'connected',scope:'PostHog project 447918',series:[series('Captured product events','events',r.data.results.map(x=>({time:x[0],value:x[1]})),'Actual captured events per hour. Missing buckets are not fabricated as zeros.')],reason:'Aggregate event counts only; no person identities, event properties or session recordings are exposed.'};
 }
 return {...base,...unavailable('unconfigured','No historical metrics adapter is configured for this service.')};
}
export async function readVercelCosts(env,fetcher=fetch,now=Date.now()){
 if(!env.VERCEL_TOKEN)return unavailable('unconfigured','Vercel billing token unavailable.');
 const end=new Date(now);end.setUTCHours(0,0,0,0);const start=new Date(end.getTime()-86400000);
 const url='https://api.vercel.com/v1/billing/charges?teamId='+TEAM+'&from='+encodeURIComponent(start.toISOString())+'&to='+encodeURIComponent(end.toISOString());
 try{
  const r=await fetcher(url,{headers:{Authorization:'Bearer '+env.VERCEL_TOKEN},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!r.ok)return unavailable([401,403].includes(r.status)?'access-denied':'unavailable','Vercel billing read failed (HTTP '+r.status+').');
  const reader=r.body.getReader(),decoder=new TextDecoder();let text='',size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8000000){await reader.cancel();return unavailable('partial','Billing export exceeds the bounded daily reader. No partial cost total is shown.');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();
  const rows=text.split('\n').filter(x=>x.trim()).map(x=>JSON.parse(x));
  if(rows.some(row=>!row||typeof row!=='object'||!('BilledCost' in row)))return unavailable('unavailable','Vercel returned an unrecognized billing export.');
  return {status:'attribution-missing',checkedAt:new Date(now).toISOString(),scope:'HQ Vercel project only',window:{start:start.toISOString(),end:end.toISOString()},series:[],reason:'The billing export is accessible, but a verified project-allocation mapping is not available. Shared team charges are excluded from LoadIQ costs.'};
 }catch{return unavailable('unavailable','Vercel billing export could not be fully validated. No partial total is shown.');}
}
