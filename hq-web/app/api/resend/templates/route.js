import {NextResponse} from 'next/server';
import {getProviderConfig} from '../../../../lib/provider-config.mjs';
import {editTemplate} from '../../../../lib/resend-edit.mjs';
import {boundedJSON} from '../../../../lib/request-json.mjs';
import {getTemplate,listTemplates,validTemplateId} from '../../../../lib/resend-templates.mjs';
import {responseHeaders} from '../../../../lib/provider-read.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';

export async function GET(request){
 const {searchParams}=new URL(request.url),id=searchParams.get('id'),after=searchParams.get('after')||'';
 if((id!==null&&!validTemplateId(id))||(after&&!validTemplateId(after)))return NextResponse.json({status:'invalid-request',reason:'Invalid template identifier.'},{status:400,headers:responseHeaders});
 try{
  const env=await getProviderConfig();
  const data=await (id?getTemplate(env,id):listTemplates(env,after));
  return NextResponse.json(data,{status:data.status==='connected'?200:502,headers:responseHeaders});
 }catch{return NextResponse.json({status:'error',reason:'Provider credential store unavailable'},{status:503,headers:responseHeaders});}
}

export async function PATCH(request){
 if(request.headers.get('origin')!==new URL(request.url).origin||!request.headers.get('content-type')?.startsWith('application/json'))return NextResponse.json({status:'blocked',reason:'Use the template editor to save.'},{status:403,headers:responseHeaders});
 try{const input=await boundedJSON(request,250000);const result=await editTemplate(await getProviderConfig(),input);return NextResponse.json(result,{status:result.status==='saved'?200:['blocked','invalid-request'].includes(result.status)?400:502,headers:responseHeaders});}
 catch(e){return NextResponse.json({status:'error',reason:e.message==='too-large'?'Template is too large.':'Template update unavailable.'},{status:e.message==='too-large'?413:400,headers:responseHeaders});}
}
