import {NextResponse} from 'next/server';
import {getProviderConfig} from '../../../../lib/provider-config.mjs';
import {boundedJSON} from '../../../../lib/request-json.mjs';
import {sendTemplateMessage} from '../../../../lib/resend-send.mjs';
import {responseHeaders} from '../../../../lib/provider-read.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=30;
export async function POST(request){
 if(request.headers.get('origin')!==new URL(request.url).origin||!request.headers.get('content-type')?.startsWith('application/json'))return NextResponse.json({status:'blocked',reason:'Use the Communications review screen to send.'},{status:403,headers:responseHeaders});
 try{
  const input=await boundedJSON(request,3000000);
  const result=await sendTemplateMessage(await getProviderConfig(),input);
  return NextResponse.json(result,{status:result.status==='accepted'?200:['invalid-request','blocked'].includes(result.status)?400:502,headers:responseHeaders});
 }catch(e){return NextResponse.json({status:'error',reason:e.message==='too-large'?'Attachments exceed the message size limit.':'Message request could not be processed.'},{status:e.message==='too-large'?413:400,headers:responseHeaders});}
}
