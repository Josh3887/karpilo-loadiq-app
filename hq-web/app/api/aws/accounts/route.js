import {validateIndex,validateCursor,validateGatewayPayload} from '../../../../lib/aws-account-contract.mjs';
import {NextResponse} from 'next/server';
import {SignatureV4} from '@smithy/signature-v4';
import {Sha256} from '@aws-crypto/sha256-js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request){
 const input=new URL(request.url).searchParams;
 const index=input.get('index'),cursor=input.get('cursor');
 if(!validateIndex(index)||!validateCursor(cursor))return NextResponse.json({error:'Invalid account index or cursor'},{status:400,headers});
 if(!process.env.AWS_ACCESS_KEY_ID||!process.env.AWS_SECRET_ACCESS_KEY)return NextResponse.json({status:'unconfigured',index,records:[]},{status:503,headers});
 const gateway=new URL('https://1zs5n02ook.execute-api.us-east-2.amazonaws.com/v1/hq/account-index');
 gateway.searchParams.set('index',index);if(cursor)gateway.searchParams.set('cursor',cursor);
 try{
  const signer=new SignatureV4({service:'execute-api',region:'us-east-2',sha256:Sha256,credentials:{accessKeyId:process.env.AWS_ACCESS_KEY_ID,secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY}});
  const query={index};if(cursor)query.cursor=cursor;
  const signed=await signer.sign({method:'GET',protocol:'https:',hostname:gateway.hostname,path:gateway.pathname,query,headers:{host:gateway.hostname,accept:'application/json'}});
  const response=await fetch(gateway,{headers:signed.headers,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(12000)});
  if(!response.ok)return NextResponse.json({status:'upstream_error',index,upstreamStatus:response.status},{status:502,headers});
  const payload=await response.json();
  if(!validateGatewayPayload(payload))return NextResponse.json({error:'Invalid upstream response'},{status:502,headers});
  return NextResponse.json({status:'connected',index,records:payload.records,nextCursor:payload.nextCursor||null},{headers});
 }catch{return NextResponse.json({status:'gateway_unreachable',index},{status:502,headers})}
}
