import {NextResponse} from 'next/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const TEAM='team_qLleecV2DYevc11UNiAprtSv';
const HEADERS={'Cache-Control':'private, no-store'};
export async function GET(request){
 const id=new URL(request.url).searchParams.get('id');
 if(!id||!/^dpl_[a-zA-Z0-9]{10,60}$/.test(id))return NextResponse.json({error:'Invalid deployment ID'},{status:400,headers:HEADERS});
 const token=process.env.VERCEL_TOKEN;
 if(!token)return NextResponse.json({status:'unconfigured',events:[]},{status:503,headers:HEADERS});
 const url=new URL('https://api.vercel.com/v2/deployments/'+id+'/events');
 url.searchParams.set('teamId',TEAM);url.searchParams.set('builds','1');url.searchParams.set('limit','100');
 try{
  const response=await fetch(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(9000)});
  if(!response.ok)return NextResponse.json({status:'unavailable',upstreamStatus:response.status,events:[]},{status:502,headers:HEADERS});
  const data=await response.json();const list=Array.isArray(data)?data:Array.isArray(data.events)?data.events:[];
  const events=list.map(x=>({type:x.type||null,level:x.level||null,createdAt:x.created||x.createdAt||null,text:String(x.text||x.message||'').slice(0,1500)})).filter(x=>x.text).slice(-100);
  return NextResponse.json({status:'connected',deploymentId:id,events,truncated:list.length>100},{headers:HEADERS});
 }catch{return NextResponse.json({status:'unavailable',events:[]},{status:502,headers:HEADERS})}
}
