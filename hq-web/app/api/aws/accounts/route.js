import {validateIndex,validateCursor,validateGatewayPayload} from '../../../../lib/aws-account-contract.mjs';
import {NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request){
 const source=new URL(request.url).searchParams.get('index');
 if(!validateIndex(source))return NextResponse.json({error:'Invalid account index'},{status:400,headers:{'Cache-Control':'private, no-store'}});
 const endpoint=process.env.HQ_AWS_ACCOUNT_GATEWAY_URL;
 const token=process.env.HQ_AWS_ACCOUNT_GATEWAY_TOKEN;
 if(!endpoint||!token)return NextResponse.json({status:'not_connected',index:source,records:[],reason:'AWS private account gateway is not yet provisioned'},{status:503,headers:{'Cache-Control':'private, no-store'}});
 const gateway=new URL(endpoint);
 if(gateway.protocol!=='https:'||gateway.username||gateway.password)return NextResponse.json({error:'Invalid gateway configuration'},{status:503});
 const target=new URL('/v1/hq/account-index',gateway.origin);
 target.searchParams.set('index',source);
 const cursor=new URL(request.url).searchParams.get('cursor');
 if(!validateCursor(cursor))return NextResponse.json({error:'Invalid cursor'},{status:400,headers:{'Cache-Control':'private, no-store'}});
 if(cursor)target.searchParams.set('cursor',cursor);
 try{
  const response=await fetch(target,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
  if(!response.ok)return NextResponse.json({status:'upstream_error',index:source},{status:502,headers:{'Cache-Control':'private, no-store'}});
  const payload=await response.json();
  if(!validateGatewayPayload(payload))return NextResponse.json({error:'Invalid upstream response'},{status:502});
  return NextResponse.json({status:'connected',index:source,records:payload.records,nextCursor:payload.nextCursor||null},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({status:'gateway_unreachable',index:source},{status:502,headers:{'Cache-Control':'private, no-store'}})}
}
