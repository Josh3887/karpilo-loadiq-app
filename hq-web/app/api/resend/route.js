import {getProviderConfig} from '../../../lib/provider-config.mjs';
import {createObservationCache} from '../../../lib/provider-cache.mjs';
const observe=createObservationCache();
import {NextResponse} from 'next/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
const H={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
async function request(path,token){
 const r=await fetch('https://api.resend.com'+path,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
 if(!r.ok){const error=Error(r.status===429?'rate-limited':[401,403].includes(r.status)?'access-denied':'unavailable');error.httpStatus=r.status;throw error;}const data=await r.json();if(!Array.isArray(data?.data))throw Error('Invalid provider response');return data;
}
async function readResend(){
 const token=(await getProviderConfig()).RESEND_API_KEY;
 if(!token)return {status:'unconfigured',checkedAt:new Date().toISOString(),coverage:{domains:'pending-key',templates:'pending-key',emails:'pending-key',broadcasts:'pending-key'},domains:null,templates:null,emails:null,broadcasts:null,reason:'Resend credential is missing from the HQ server configuration.'};
 const keys=['domains','templates','emails','broadcasts'];
 const endpoints=['/domains?limit=20','/templates?limit=20','/emails?limit=20','/broadcasts?limit=20'];
 const settled=await Promise.allSettled(endpoints.map(x=>request(x,token)));
 const coverage=Object.fromEntries(keys.map((k,i)=>[k,settled[i].status==='fulfilled'?'connected':(['rate-limited','access-denied'].includes(settled[i].reason?.message)?settled[i].reason.message:'unavailable')]));
 const data=Object.fromEntries(keys.map((k,i)=>[k,settled[i].status==='fulfilled'?settled[i].value:null]));
 const rows=x=>Array.isArray(x?.data)?x.data:Array.isArray(x)?x:[];
 return {status:Object.values(coverage).every(x=>x==='connected')?'connected':Object.values(coverage).some(x=>x==='connected')?'partial':'error',checkedAt:new Date().toISOString(),coverage,httpStatuses:Object.fromEntries(keys.map((k,i)=>[k,settled[i].status==='fulfilled'?200:settled[i].reason?.httpStatus??null])),reason:Object.values(coverage).includes('access-denied')?'Resend denied inventory access. HQ needs an API key permitted to list domains, templates, emails and broadcasts.':null,pagination:Object.fromEntries(keys.map(k=>[k,Boolean(data[k]?.has_more)])),
 domains:data.domains?rows(data.domains).map(x=>({id:x.id,name:x.name,status:x.status,region:x.region,createdAt:x.created_at,capabilities:x.capabilities||null})):null,
 templates:data.templates?rows(data.templates).map(x=>({id:x.id,name:x.name,alias:x.alias,status:x.status,createdAt:x.created_at,updatedAt:x.updated_at})):null,
 emails:data.emails?rows(data.emails).map(x=>({id:x.id,subject:x.subject,status:x.last_event||x.status,createdAt:x.created_at})):null,
 broadcasts:data.broadcasts?rows(data.broadcasts).map(x=>({id:x.id,name:x.name,status:x.status,createdAt:x.created_at,scheduledAt:x.scheduled_at})):null
 };
}

export async function GET(){try{return NextResponse.json(await observe('resend',readResend),{headers:H})}catch{return NextResponse.json({status:'error',reason:'Provider credential store unavailable'},{status:503,headers:H})}}
