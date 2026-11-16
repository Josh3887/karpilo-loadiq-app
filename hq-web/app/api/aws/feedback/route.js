import {NextResponse} from 'next/server';
import {SignatureV4} from '@smithy/signature-v4';
import {Sha256} from '@aws-crypto/sha256-js';
import {boundedJSON} from '../../../../lib/request-json.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
async function handle(request){
 try{
  const incoming=new URL(request.url);
  if(request.method!=='GET' && (request.headers.get('origin')!==incoming.origin||request.headers.get('sec-fetch-site')==='cross-site'))return NextResponse.json({error:'Same-origin request required'},{status:403,headers});
  const configured=process.env.HQ_AWS_FEEDBACK_GATEWAY_URL;
  if(!configured||!process.env.AWS_ACCESS_KEY_ID||!process.env.AWS_SECRET_ACCESS_KEY)return NextResponse.json({error:'AWS feedback gateway is not configured. No messages have been loaded or sent.'},{status:503,headers});
  const target=new URL(configured);
  if(!/^https:\/\/[a-z0-9]+\.execute-api\.us-east-2\.amazonaws\.com\/v1\/feedback$/.test(target.href))throw Error('Invalid AWS target');
  const offset=incoming.searchParams.get('offset')||'0';
  if(!/^(0|[1-9][0-9]{0,5})$/.test(offset)||Number(offset)>100000)return NextResponse.json({error:'Invalid page'},{status:400,headers});
  const query=request.method==='GET'?{offset}:{};
  if(request.method==='GET')target.searchParams.set('offset',offset);
  const body=request.method==='GET'?undefined:JSON.stringify(await boundedJSON(request,20000));
  const signer=new SignatureV4({service:'execute-api',region:'us-east-2',sha256:Sha256,credentials:{accessKeyId:process.env.AWS_ACCESS_KEY_ID,secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,...(process.env.AWS_SESSION_TOKEN?{sessionToken:process.env.AWS_SESSION_TOKEN}:{})}});
  const signed=await signer.sign({method:request.method,protocol:'https:',hostname:target.hostname,path:target.pathname,query,body,headers:{host:target.hostname,'content-type':'application/json'}});
  const upstream=await fetch(target,{method:request.method,headers:signed.headers,body,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(12000)});
  if(!upstream.ok)return NextResponse.json({error:upstream.status===409?'This conversation changed. Refresh before trying again.':upstream.status===400?'Invalid feedback action.':'AWS feedback service unavailable.'},{status:[400,403,404,409,429].includes(upstream.status)?upstream.status:502,headers});
  return NextResponse.json(await upstream.json(),{headers});
 }catch(e){return NextResponse.json({error:e?.message==='too-large'?'Request too large':'AWS feedback request failed'},{status:e?.message==='too-large'?413:502,headers});}
}
export {handle as GET,handle as POST};
