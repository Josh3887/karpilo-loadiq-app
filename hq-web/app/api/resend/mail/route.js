import {NextResponse} from 'next/server';
import {getProviderConfig} from '../../../../lib/provider-config.mjs';
import {readMail} from '../../../../lib/resend-mail.mjs';
import {responseHeaders} from '../../../../lib/provider-read.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request){
 try{const p=new URL(request.url).searchParams;const result=await readMail(await getProviderConfig(),{folder:p.get('folder')||'sent',id:p.get('id')||'',after:p.get('after')||''});return NextResponse.json(result,{status:result.status==='connected'?200:result.status==='invalid-request'?400:502,headers:responseHeaders});}
 catch{return NextResponse.json({status:'error',reason:'Mailbox unavailable.'},{status:503,headers:responseHeaders});}
}
