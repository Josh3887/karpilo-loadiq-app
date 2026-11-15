import {NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const project='prj_pacuzxyQu9EFASSrYJZzAN2ziKjT';
const team='team_qLleecV2DYevc11UNiAprtSv';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
async function vercel(path,token){
 const url=new URL('https://api.vercel.com'+path);
 url.searchParams.set('teamId',team);
 const response=await fetch(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(8500),redirect:'error'});
 if(!response.ok)throw Error('vercel_http_'+response.status);
 return response.json();
}
export async function GET(){
 const token=process.env.VERCEL_TOKEN;
 if(!token)return NextResponse.json({status:'unconfigured',reason:'A read-only Vercel API token has not been provisioned for HQ',projectId:project,projectName:'karpilo-loadiq-hq',deployments:null,domains:null},{status:200,headers});
 const queries=[
  '/v9/projects/'+project,
  '/v6/deployments?projectId='+project+'&limit=20',
  '/v9/projects/'+project+'/domains?limit=50'
 ];
 const results=await Promise.allSettled(queries.map(q=>vercel(q,token)));
 const val=i=>results[i].status==='fulfilled'?results[i].value:null;
 const p=val(0),d=val(1),domains=val(2);
 if(!p)return NextResponse.json({status:'error',reason:'Vercel project API unavailable',projectId:project},{status:502,headers});
 const deployments=Array.isArray(d?.deployments)?d.deployments.map(x=>({
  id:x.uid||x.id,name:x.name,url:x.url?'https://'+x.url:null,
  state:x.readyState||x.state,target:x.target||null,createdAt:x.createdAt||x.created||null,
  branch:x.meta?.githubCommitRef||null,commit:x.meta?.githubCommitSha?.slice(0,12)||null,
  message:x.meta?.githubCommitMessage||null
 })):null;
 return NextResponse.json({
  status:'connected',checkedAt:new Date().toISOString(),
  project:{id:p.id,name:p.name,framework:p.framework,nodeVersion:p.nodeVersion,latestDeployment:p.latestDeployments?.[0]?.id||p.latestDeployment?.id||null},
  deployments,
  domains:Array.isArray(domains?.domains)?domains.domains.map(x=>({name:x.name,verified:x.verified,branch:x.gitBranch||null,redirect:x.redirect||null})):null,
  partial:deployments===null||domains===null
 },{headers});
}
