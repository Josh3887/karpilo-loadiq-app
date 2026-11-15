import {NextResponse} from 'next/server';
import {getProviderConfig} from '../../../../lib/provider-config.mjs';
import {createObservationCache} from '../../../../lib/provider-cache.mjs';
import {getTemplate,listTemplates,validTemplateId} from '../../../../lib/resend-templates.mjs';
import {responseHeaders} from '../../../../lib/provider-read.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
const observe=createObservationCache();
export async function GET(request){
 const {searchParams}=new URL(request.url),id=searchParams.get('id'),after=searchParams.get('after')||'';
 if((id!==null&&!validTemplateId(id))||(after&&!validTemplateId(after)))return NextResponse.json({status:'invalid-request',reason:'Invalid template identifier.'},{status:400,headers:responseHeaders});
 try{
  const env=await getProviderConfig();
  const data=await observe(id?'template:'+id:'templates:'+after,()=>id?getTemplate(env,id):listTemplates(env,after));
  return NextResponse.json(data,{status:data.status==='connected'?200:502,headers:responseHeaders});
 }catch{return NextResponse.json({status:'error',reason:'Provider credential store unavailable'},{status:503,headers:responseHeaders});}
}
