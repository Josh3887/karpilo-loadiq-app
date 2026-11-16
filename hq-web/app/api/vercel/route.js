import {NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const PROJECT='prj_pacuzxyQu9EFASSrYJZzAN2ziKjT',TEAM='team_qLleecV2DYevc11UNiAprtSv';
const H={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const TIMEOUT=9000;
async function api(path,token){
 const url=new URL('https://api.vercel.com'+path);
 url.searchParams.set('teamId',TEAM);
 const res=await fetch(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(TIMEOUT),redirect:'error'});
 if(!res.ok)throw Error('HTTP '+res.status);
 return res.json();
}
const asTime=v=>v==null?null:typeof v==='number'?v:Date.parse(v);
const deployment=x=>({
 id:x.uid||x.id,name:x.name,url:x.url?'https://'+x.url:null,
 state:x.readyState||x.state||'UNKNOWN',target:x.target||'preview',
 createdAt:asTime(x.createdAt||x.created),readyAt:asTime(x.ready||x.readyAt),
 branch:x.meta?.githubCommitRef||null,commit:x.meta?.githubCommitSha?.slice(0,12)||null,
 message:x.meta?.githubCommitMessage||null,creator:x.creator?.username||null,
 inspectorUrl:x.inspectorUrl||null
});
export async function GET(){
 const token=process.env.VERCEL_TOKEN;
 if(!token)return NextResponse.json({status:'unconfigured',reason:'VERCEL_TOKEN missing',coverage:{}},{headers:H});
 const paths={
  project:'/v9/projects/'+PROJECT,
  deployments:'/v6/deployments?projectId='+PROJECT+'&limit=100',
  domains:'/v9/projects/'+PROJECT+'/domains?limit=100',
  team:'/v2/teams/'+TEAM
 };
 const keys=Object.keys(paths);
 const settled=await Promise.allSettled(keys.map(k=>api(paths[k],token)));
 const raw=Object.fromEntries(keys.map((k,i)=>[k,settled[i].status==='fulfilled'?settled[i].value:null]));
 const coverage=Object.fromEntries(keys.map((k,i)=>[k,{status:settled[i].status==='fulfilled'?'connected':'unavailable',reason:settled[i].status==='rejected'?String(settled[i].reason?.message||'Request failed'):null}]));
 if(!raw.project)return NextResponse.json({status:'error',coverage,reason:'Project API request failed'},{status:502,headers:H});
 const deployments=Array.isArray(raw.deployments?.deployments)?raw.deployments.deployments.map(deployment):null;
 const counts=deployments?{
  total:deployments.length,ready:deployments.filter(d=>d.state==='READY').length,
  failed:deployments.filter(d=>['ERROR','CANCELED'].includes(d.state)).length,
  building:deployments.filter(d=>['BUILDING','INITIALIZING','QUEUED'].includes(d.state)).length,
  production:deployments.filter(d=>d.target==='production').length
 }:null;
 const domains=Array.isArray(raw.domains?.domains)?raw.domains.domains.map(x=>({name:x.name,verified:x.verified,branch:x.gitBranch||null,redirect:x.redirect||null})):null;
 return NextResponse.json({
  status:'connected',mode:'api',checkedAt:new Date().toISOString(),coverage,partial:Object.values(coverage).some(x=>x.status!=='connected'),
  project:{id:raw.project.id,name:raw.project.name,framework:raw.project.framework,nodeVersion:raw.project.nodeVersion,latestDeployment:raw.project.latestDeployments?.[0]?.id||raw.project.latestDeployment?.id||null},
  team:{id:TEAM,name:raw.team?.name||null,slug:raw.team?.slug||null},
  deployments,counts,domains,
  links:{project:'https://vercel.com/joshs-projects-0cf217e5/karpilo-loadiq-hq',logs:'https://vercel.com/joshs-projects-0cf217e5/karpilo-loadiq-hq/logs',analytics:'https://vercel.com/joshs-projects-0cf217e5/karpilo-loadiq-hq/analytics',usage:'https://vercel.com/joshs-projects-0cf217e5/~/usage'}
 },{headers:H});
}
