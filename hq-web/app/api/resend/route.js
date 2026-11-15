import {NextResponse} from 'next/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const H={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
async function request(path,token){
 const r=await fetch('https://api.resend.com'+path,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();if(!Array.isArray(data?.data))throw Error('Invalid provider response');return data;
}
export async function GET(){
 const token=process.env.RESEND_API_KEY;
 if(!token)return NextResponse.json({status:'unconfigured',checkedAt:new Date().toISOString(),coverage:{domains:'pending-key',templates:'pending-key',emails:'pending-key',broadcasts:'pending-key'},domains:null,templates:null,emails:null,broadcasts:null,reason:'API-key setup deferred by founder. No live Resend data is claimed.'},{headers:H});
 const keys=['domains','templates','emails','broadcasts'];
 const endpoints=['/domains?limit=20','/templates?limit=20','/emails?limit=20','/broadcasts?limit=20'];
 const settled=await Promise.allSettled(endpoints.map(x=>request(x,token)));
 const coverage=Object.fromEntries(keys.map((k,i)=>[k,settled[i].status==='fulfilled'?'connected':'unavailable']));
 const data=Object.fromEntries(keys.map((k,i)=>[k,settled[i].status==='fulfilled'?settled[i].value:null]));
 const rows=x=>Array.isArray(x?.data)?x.data:Array.isArray(x)?x:[];
 return NextResponse.json({status:Object.values(coverage).every(x=>x==='connected')?'connected':Object.values(coverage).some(x=>x==='connected')?'partial':'error',checkedAt:new Date().toISOString(),coverage,pagination:Object.fromEntries(keys.map(k=>[k,Boolean(data[k]?.has_more)])),
 domains:data.domains?rows(data.domains).map(x=>({id:x.id,name:x.name,status:x.status,region:x.region,createdAt:x.created_at,capabilities:x.capabilities||null})):null,
 templates:data.templates?rows(data.templates).map(x=>({id:x.id,name:x.name,alias:x.alias,status:x.status,createdAt:x.created_at,updatedAt:x.updated_at})):null,
 emails:data.emails?rows(data.emails).map(x=>({id:x.id,subject:x.subject,status:x.last_event||x.status,createdAt:x.created_at})):null,
 broadcasts:data.broadcasts?rows(data.broadcasts).map(x=>({id:x.id,name:x.name,status:x.status,createdAt:x.created_at,scheduledAt:x.scheduled_at})):null
 },{headers:H});
}
