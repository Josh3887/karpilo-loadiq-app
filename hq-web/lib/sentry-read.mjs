import {connectionStatus} from './provider-read.mjs';
export const sentryOrganization='karpilo-endeavor-technologies';
const root='https://sentry.io/api/0/organizations/'+sentryOrganization;
const slug=x=>typeof x==='string'&&/^[a-z0-9_-]{1,200}$/i.test(x);
const id=x=>typeof x==='string'&&/^\d+$/.test(x);
const date=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))?x:null;
const count=x=>/^\d+$/.test(String(x))?String(x):null;
async function read(path,token,fetcher,validate){
 try{
  const r=await fetcher(root+path,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
  if(!r.ok)return {status:r.status===429?'rate-limited':[401,403].includes(r.status)?'access-denied':'unavailable',data:null,hasMore:null};
  const data=await r.json();if(!validate(data))return {status:'unavailable',data:null,hasMore:null};
  const link=r.headers?.get('link')||'';
  const next=link.split(',').find(x=>/rel="next"/.test(x));
  return {status:'connected',data,hasMore:next?/results="true"/.test(next):false};
 }catch{return {status:'unavailable',data:null,hasMore:null}}
}
export async function readSentry(env={},fetcher=fetch){
 const checkedAt=new Date().toISOString(), keys=['organization','projects','issues'];
 const empty={checkedAt,organization:null,projects:null,issues:null,pagination:{},window:'14d',query:'is:unresolved',environment:'all'};
 if(!env.SENTRY_AUTH_TOKEN)return {...empty,status:'unconfigured',coverage:Object.fromEntries(keys.map(k=>[k,'unconfigured'])),reason:'Sentry dashboard API token is missing. An ingestion DSN cannot authorize these reads.'};
 const [org,projects,issues]=await Promise.all([
  read('/',env.SENTRY_AUTH_TOKEN,fetcher,x=>x?.slug===sentryOrganization&&id(x.id)),
  read('/projects/?per_page=100',env.SENTRY_AUTH_TOKEN,fetcher,x=>Array.isArray(x)&&x.every(p=>id(p.id)&&slug(p.slug))),
  read('/issues/?query=is%3Aunresolved&statsPeriod=14d&sort=date&limit=20',env.SENTRY_AUTH_TOKEN,fetcher,x=>Array.isArray(x)&&x.every(i=>id(i.id)&&slug(i.shortId)&&id(i.project?.id)&&slug(i.project?.slug)))
 ]);
 const coverage=Object.fromEntries(keys.map((k,i)=>[k,[org,projects,issues][i].status]));
 return {...empty,status:connectionStatus(coverage),coverage,
  organization:org.data?{slug:sentryOrganization,id:org.data.id}:null,
  projects:projects.data?.filter(p=>p.slug==='karpilo-loadiq-isolated').slice(0,100).map(p=>({id:p.id,slug:p.slug,platform:slug(p.platform)?p.platform:null,firstEvent:date(p.firstEvent)}))??null,
  issues:issues.data?.filter(i=>i.project.slug==='karpilo-loadiq-isolated').slice(0,20).map(i=>({id:i.id,shortId:i.shortId,project:i.project.slug,status:['unresolved','resolved','ignored'].includes(i.status)?i.status:'unknown',level:['fatal','error','warning','info','debug'].includes(i.level)?i.level:'unknown',count:count(i.count),firstSeen:date(i.firstSeen),lastSeen:date(i.lastSeen),url:'https://'+sentryOrganization+'.sentry.io/issues/'+i.id+'/'}))??null,
  pagination:{projects:projects.hasMore,issues:issues.hasMore},
  reason:'Only karpilo-loadiq-isolated is attributed to this product. Bounded provider pages are filtered to this project; other projects are excluded. Up to 20 unresolved issues seen in the last 14 days, all environments. Counts are provider-reported issue counts, not a billing total. Empty results do not prove application health. Error text, stack traces, users and request details stay in Sentry. Performance, releases, alerts and billing are not connected.'};
}
