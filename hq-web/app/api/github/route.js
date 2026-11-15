import {NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const owner='Josh3887',repo='karpilo-loadiq-app';
const base='https://api.github.com/repos/'+owner+'/'+repo;
const headers={Accept:'application/vnd.github+json','User-Agent':'Karpilo-LoadIQ-HQ','X-GitHub-Api-Version':'2022-11-28'};
const outputHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
async function read(path){
 const url=new URL(base+path);
 const response=await fetch(url,{headers:{...headers,...(process.env.GITHUB_TOKEN?{Authorization:'Bearer '+process.env.GITHUB_TOKEN}:{})},next:{revalidate:60},signal:AbortSignal.timeout(7500)});
 if(!response.ok)throw Error('github_'+response.status);
 return response.json();
}
export async function GET(){
 try{
  const paths=['','/actions/runs?per_page=10','/pulls?state=open&per_page=20','/issues?state=open&per_page=20','/releases?per_page=5','/branches?per_page=20'];
  const settled=await Promise.allSettled(paths.map(read));
  const val=i=>settled[i].status==='fulfilled'?settled[i].value:null;
  const repository=val(0);if(!repository)return NextResponse.json({status:'error',reason:'GitHub repository unavailable'},{status:502,headers:outputHeaders});
  const runs=val(1)?.workflow_runs;
  const pulls=val(2),issues=val(3),releases=val(4),branches=val(5);
  const shape=x=>({number:x.number,title:x.title,state:x.state,url:x.html_url,createdAt:x.created_at,updatedAt:x.updated_at});
  return NextResponse.json({
   status:'connected',checkedAt:new Date().toISOString(),
   repository:{name:repository.full_name,url:repository.html_url,visibility:repository.visibility,defaultBranch:repository.default_branch,archived:repository.archived,openIssues:repository.open_issues_count,lastPush:repository.pushed_at},
   workflows:Array.isArray(runs)?runs.map(x=>({id:x.id,name:x.name,status:x.status,conclusion:x.conclusion,branch:x.head_branch,sha:x.head_sha?.slice(0,12),url:x.html_url,createdAt:x.created_at})):null,
   pullRequests:Array.isArray(pulls)?pulls.map(shape):null,
   issues:Array.isArray(issues)?issues.filter(x=>!x.pull_request).map(shape):null,
   releases:Array.isArray(releases)?releases.map(x=>({name:x.name,tag:x.tag_name,url:x.html_url,publishedAt:x.published_at,prerelease:x.prerelease})):null,
   branches:Array.isArray(branches)?branches.map(x=>({name:x.name,protected:x.protected})):null,
   partial:!Array.isArray(runs)||!Array.isArray(pulls)||!Array.isArray(issues)||!Array.isArray(releases)||!Array.isArray(branches),
   mode:process.env.GITHUB_TOKEN?'authenticated-read-only':'public-read-only'
  },{headers:outputHeaders});
 }catch{return NextResponse.json({status:'error',reason:'GitHub request failed'},{status:502,headers:outputHeaders})}
}
