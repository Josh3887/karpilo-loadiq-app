import {NextResponse} from 'next/server';
import {getProviderConfig} from '../../../../lib/provider-config.mjs';
import {sendTemplateMessage} from '../../../../lib/resend-send.mjs';
import {responseHeaders} from '../../../../lib/provider-read.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=30;
export async function POST(request){
 if(request.headers.get('origin')!==new URL(request.url).origin||!request.headers.get('content-type')?.startsWith('application/json'))return NextResponse.json({status:'blocked',reason:'Use the Communications review screen to send.'},{status:403,headers:responseHeaders});
 try{
  const raw=await request.text();if(raw.length>64000)return NextResponse.json({status:'invalid-request',reason:'Message personalization is too large.'},{status:413,headers:responseHeaders});
  let input;try{input=JSON.parse(raw)}catch{return NextResponse.json({status:'invalid-request',reason:'Invalid message request.'},{status:400,headers:responseHeaders})}
  const result=await sendTemplateMessage(await getProviderConfig(),input);
  return NextResponse.json(result,{status:result.status==='accepted'?200:['invalid-request','blocked'].includes(result.status)?400:502,headers:responseHeaders});
 }catch{return NextResponse.json({status:'error',reason:'Provider credential store unavailable'},{status:503,headers:responseHeaders});}
}
