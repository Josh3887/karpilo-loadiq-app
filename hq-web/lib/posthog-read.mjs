import {readJSON,connectionStatus} from './provider-read.mjs';
export const posthogOrganization='019e7d60-e839-0000-2715-136885c6fd67';
const id=x=>Number.isSafeInteger(x)&&x>0;
const name=x=>typeof x==='string'?x.slice(0,200):null;
const date=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))?x:null;
const page=x=>x&&Array.isArray(x.results)&&x.results.every(i=>id(i.id))&&(x.next===null||typeof x.next==='string');
export async function readPosthog(env={},fetcher=fetch){
 const keys=['project','dashboards','insights'],checkedAt=new Date().toISOString();
 const empty={checkedAt,project:null,dashboards:null,insights:null,pagination:{}};
 const unavailable=(status,reason)=>({...empty,status,coverage:Object.fromEntries(keys.map(k=>[k,status])),reason});
 if(['POSTHOG_PERSONAL_API_KEY','POSTHOG_HOST','POSTHOG_PROJECT_ID'].some(k=>!env[k]))return unavailable('unconfigured','Private PostHog API key, host and project ID are required. An ingestion token is not dashboard access.');
 let origin;try{const u=new URL(env.POSTHOG_HOST);if(!['https://us.posthog.com','https://eu.posthog.com','https://app.posthog.com'].includes(u.origin)||u.username||u.password||u.pathname!=='/'||u.search||u.hash||!/^([1-9][0-9]*)$/.test(env.POSTHOG_PROJECT_ID)||!id(Number(env.POSTHOG_PROJECT_ID)))throw Error();origin=u.origin}catch{return unavailable('error','PostHog server configuration is invalid.')}
 const projectId=env.POSTHOG_PROJECT_ID,root=origin+'/api/projects/'+projectId;
 const paths=[origin+'/api/organizations/'+posthogOrganization+'/projects/'+projectId+'/',root+'/dashboards/?limit=50',root+'/insights/?limit=50&saved=true&basic=true&refresh=force_cache'];
 const checks=[x=>x?.id===Number(projectId)&&x.organization===posthogOrganization&&typeof x.name==='string',page,page];
 const reads=await Promise.all(paths.map(async(url,i)=>{const r=await readJSON(url,'Bearer '+env.POSTHOG_PERSONAL_API_KEY,fetcher);return r.status==='connected'&&!checks[i](r.data)?{status:'unavailable',data:null}:r}));
 const coverage=Object.fromEntries(keys.map((k,i)=>[k,reads[i].status]));
 const [project,dashboards,insights]=reads.map(r=>r.data);
 const rows=data=>data?.results.slice(0,50).map(i=>({id:i.id,name:name(i.name)||'Untitled',createdAt:date(i.created_at)}))??null;
 return {...empty,status:connectionStatus(coverage),coverage,
 project:project?{id:project.id,name:name(project.name),timezone:name(project.timezone),ingestedEvent:typeof project.ingested_event==='boolean'?project.ingested_event:null}:null,
 dashboards:rows(dashboards),insights:rows(insights),
 pagination:{dashboards:dashboards?Boolean(dashboards.next)||dashboards.results.length>50:null,insights:insights?Boolean(insights.next)||insights.results.length>50:null},
 reason:'Read-only project metadata and the first 50 dashboards and saved insights. Event ingestion is provider-reported, not an end-to-end capture test. Hourly event-query access is checked below. Session replay, feature flags and billing are not connected.'};
}
