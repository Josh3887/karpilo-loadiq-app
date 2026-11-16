import crypto from 'node:crypto';
// Verified against isolated-test PostgreSQL information_schema on 2026-11-14.
// Only non-secret operational columns; no arbitrary JSON blobs, payment identifiers or contact PII.
const INDEXES=Object.freeze({
 subscribers:'SELECT owner_id AS id, updated_at FROM karpilo.profiles',
 subscriptions:'SELECT owner_id AS id, updated_at FROM karpilo.billing_access',
 vehicles:'SELECT id, owner_id, updated_at FROM karpilo.vehicles',
 expenses:'SELECT id, owner_id, updated_at FROM karpilo.expenses',
 profit_profiles:'SELECT owner_id AS id, updated_at FROM karpilo.goals',
 saved_loads:'SELECT id, owner_id, status, created_at FROM karpilo.loads'
});
const PAGE_SIZE=100;
const respond=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
const validToken=(header,secret)=>{if(!secret||secret.length<32||typeof header!=='string'||!header.startsWith('Bearer '))return false;const a=Buffer.from(header.slice(7));const b=Buffer.from(secret);return a.length===b.length&&crypto.timingSafeEqual(a,b);};
const decode=(cursor)=>{if(cursor===null)return 0;if(cursor.length>512||!/^[A-Za-z0-9_-]+$/.test(cursor))throw Error('cursor');const raw=Buffer.from(cursor,'base64url').toString('utf8');if(!/^(0|[1-9][0-9]{0,8})$/.test(raw))throw Error('cursor');const n=Number(raw);if(!Number.isSafeInteger(n)||n>100000000)throw Error('cursor');return n;};
export function createGatewayHandler({query,token,logger=console}){
 return async(req,res)=>{
  if(!validToken(req.headers.authorization,token))return respond(res,401,{error:'Unauthorized'});
  let url;try{url=new URL(req.url,'http://gateway.internal')}catch{return respond(res,400,{error:'Invalid request'})}
  if(req.method!=='GET'||url.pathname!=='/v1/hq/account-index')return respond(res,404,{error:'Not found'});
  const index=url.searchParams.get('index');
  if(!Object.hasOwn(INDEXES,index)||url.searchParams.getAll('index').length!==1)return respond(res,400,{error:'Invalid index'});
  let offset;try{if(url.searchParams.getAll('cursor').length>1)throw Error('cursor');offset=decode(url.searchParams.get('cursor'))}catch{return respond(res,400,{error:'Invalid cursor'})}
  try{
   const rows=await query({text:`SELECT * FROM (${INDEXES[index]}) AS hq_index ORDER BY id LIMIT $1 OFFSET $2`,values:[PAGE_SIZE+1,offset]});
   if(!Array.isArray(rows.rows))throw Error('bad result');
   return respond(res,200,{records:rows.rows.slice(0,PAGE_SIZE),nextCursor:rows.rows.length>PAGE_SIZE?Buffer.from(String(offset+PAGE_SIZE)).toString('base64url'):null});
  }catch(e){logger.error('HQ gateway query failure',{index,code:e.code||'unknown'});return respond(res,503,{error:'Data source unavailable'})}
 };
}
