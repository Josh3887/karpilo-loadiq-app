export const identity = Object.freeze({pool:'us-east-2_8qoSv09kl',client:'1kcpiqvjpo6ck6pl2f7k595ddn',email:'j.karpilo@karpilo-liq.com'});
export class AccessError extends Error { constructor(status,message){super(message);this.status=status;} }
export function operatorAccess(claims, allowedSubjects) {
  if(claims.token_use!=='access' || claims.client_id!==identity.client || claims.iss!==`https://cognito-idp.us-east-2.amazonaws.com/${identity.pool}`)throw new AccessError(401,'HQ sign-in required');
  if(!allowedSubjects.has(claims.sub))throw new AccessError(403,'Operator access not enrolled');
  return `hq:${claims.sub}`;
}
export function deliveryGuard(env) {
  if(env.RESEND_ENABLED!=='false' || env.RESEND_BILLING_ALERTS_ENABLED!=='false' || env.AWS_COMMUNICATIONS_ENABLED!=='true')throw new AccessError(503,'Email hold configuration must be verified');
}
export function createRouter({verify,allowedSubjects,support,analytics,templates,env}) {
 return async function route(req) {
  const headers={'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'};
  try {
   const token=req.headers.get('authorization')?.match(/^Bearer ([^ ]+)$/)?.[1];
   if(!token)throw new AccessError(401,'HQ sign-in required');
   let claims;try{claims=await verify(token);}catch{throw new AccessError(401,'HQ sign-in required');}
   const actor=operatorAccess(claims,allowedSubjects);
   const url=new URL(req.url), p=url.pathname.split('/').filter(Boolean);
   let result;
   if(req.method==='GET' && url.pathname==='/v1/session')result={actor,emailSending:false};
   else if(req.method==='GET' && url.pathname==='/v1/analytics')result=await analytics();
   else if(req.method==='GET' && url.pathname==='/v1/templates')result=await templates.list(url.searchParams.get('after'));
   else if(req.method==='GET' && p.length===3 && p[0]==='v1' && p[1]==='templates')result=await templates.read(p[2]);
   else if(req.method==='GET' && url.pathname==='/v1/conversations') {
    const offset=Number(url.searchParams.get('offset')??0);
    if(!Number.isInteger(offset)||offset<0||offset>100000)throw new AccessError(400,'Invalid page');
    result=await support(actor).list(undefined,offset);
   } else if(p.length===4 && p[0]==='v1' && p[1]==='conversations') {
    if(req.method==='GET')result=await support(actor).read(decodeURIComponent(p[2]),p[3]);
    else if(req.method==='PUT') {
     deliveryGuard(env);
     if(!req.headers.get('content-type')?.startsWith('application/json'))throw new AccessError(415,'JSON required');
     const raw=await req.text();if(Buffer.byteLength(raw)>16384)throw new AccessError(413,'Message too large');
     let body;try{body=JSON.parse(raw);}catch{throw new AccessError(400,'Invalid JSON');}
     result=await support(actor).respond(decodeURIComponent(p[2]),p[3],body);
    } else throw new AccessError(405,'Method not allowed');
   } else throw new AccessError(404,'Not found');
   return new Response(JSON.stringify(result),{headers});
  }catch(e){return new Response(JSON.stringify({error:e instanceof AccessError?e.message:'HQ service unavailable'}),{status:e instanceof AccessError?e.status:503,headers});}
 };
}
