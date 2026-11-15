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
 if(!token){
 const current={id:process.env.VERCEL_DEPLOYMENT_ID||null,name:process.env.VERCEL_PROJECT_PRODUCTION_URL||'karpilo-loadiq-hq',url:process.env.VERCEL_URL?'https://'+process.env.VERCEL_URL:null,state:'READY',target:process.env.VERCEL_ENV||'preview',createdAt:null,branch:process.env.VERCEL_GIT_COMMIT_REF||null,commit:process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,12)||null,message:process.env.VERCEL_GIT_COMMIT_MESSAGE||null};
 let gitDeployments=null;
 try{
  const response=await fetch('https://api.github.com/repos/Josh3887/karpilo-loadiq-app/deployments?per_page=20',{headers:{Accept:'application/vnd.github+json','User-Agent':'Karpilo-LoadIQ-HQ'},cache:'no-store',signal:AbortSignal.timeout(6000)});
  if(response.ok){const rows=await response.json();gitDeployments=rows.filter(x=>x.environment?.toLowerCase().includes('vercel')||x.payload?.provider==='vercel').map(x=>({id:'github-'+x.id,name:'GitHub deployment event',url:x.payload?.web_url||null,state:'RECORDED',target:x.environment||null,createdAt:x.created_at,branch:x.ref,commit:x.sha?.slice(0,12),message:x.description||null}));}
 }catch{}
 return NextResponse.json({status:'connected',mode:'deployment-runtime',checkedAt:new Date().toISOString(),project:{id:project,name:'karpilo-loadiq-hq',framework:'nextjs',nodeVersion:process.version,latestDeployment:current.id},deployments:[current,...(gitDeployments||[])],domains:null,partial:true,reason:'Live current deployment from Vercel runtime. GitHub deployment events are historical records, not Vercel build-status verification. Full account-wide telemetry requires a scoped API token.'},{headers});
}
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
  status:'connected',mode:'api',checkedAt:new Date().toISOString(),
  project:{id:p.id,name:p.name,framework:p.framework,nodeVersion:p.nodeVersion,latestDeployment:p.latestDeployments?.[0]?.id||p.latestDeployment?.id||null},
  deployments,
  domains:Array.isArray(domains?.domains)?domains.domains.map(x=>({name:x.name,verified:x.verified,branch:x.gitBranch||null,redirect:x.redirect||null})):null,
  partial:deployments===null||domains===null
 },{headers});
}
