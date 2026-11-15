import {readJSON,connectionStatus} from './provider-read.mjs';
export const zones=[{name:'karpilo-liq.com',id:'354a61884ea0777e1c8a1a8f01b8aa8a'},{name:'karpiloendeavor.com',id:'b8415789be0c168fb1ef529b2d473f18'},{name:'karpilofleetos.com',id:'1608ce26faf5c48a8723769c755355a5'},{name:'k-atls-aisystems.com',id:'7932894dfdad4636497fe9e4973e05e0'},{name:'project-alter-ego.com',id:'11e3c527f7d03d54b76805da733426db'},{name:'zaharasworld.com',id:'36058f476f19b4c80ebea11186e565b0'}];
const probes=['hq.karpilo-liq.com','app.karpilo-liq.com','karpilo-liq.com','argus.karpiloendeavor.com'];
async function dns(name,type,fetch){try{const url=new URL('https://cloudflare-dns.com/dns-query');url.searchParams.set('name',name);url.searchParams.set('type',type);const r=await fetch(url,{headers:{Accept:'application/dns-json'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(6500)});if(!r.ok)throw Error();const d=await r.json();return {status:d.Status,answers:(d.Answer||[]).map(a=>({type:a.type,data:a.data,ttl:a.TTL})).slice(0,12)}}catch{return {status:null,answers:[],error:'DNS probe unavailable'}}}
async function http(name,fetch){try{const r=await fetch('https://'+name,{method:'HEAD',cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(7000)});return {status:r.status,reachable:true,redirect:r.headers.get('location')?.slice(0,300)||null}}catch{return {status:null,reachable:false}}}

const aggregate=values=>values.every(x=>x==='connected')?'connected':values.some(x=>x==='connected')?'partial':values.every(x=>x===values[0])?values[0]:'unavailable';
async function api(path,token,fetcher,validate){
 const r=await readJSON('https://api.cloudflare.com/client/v4'+path,'Bearer '+token,fetcher,8500);
 if(r.status!=='connected')return r;
 if(r.data?.success!==true||!validate(r.data.result))return {status:'unavailable',data:null};
 return r;
}
export async function readCloudflare(env={},fetcher=fetch){
 const token=env.CLOUDFLARE_API_TOKEN;
 const checksPromise=Promise.all(probes.map(async name=>{
  const [cname,a,web]=await Promise.all([dns(name,'CNAME',fetcher),dns(name,'A',fetcher),http(name,fetcher)]);
  return {name,cname,a,http:web};
 }));
 const inventoryPromise=token?Promise.all(zones.map(async z=>{
  const [zone,records]=await Promise.all([
   api('/zones/'+z.id,token,fetcher,x=>x?.id===z.id&&x?.name===z.name&&typeof x.status==='string'),
   api('/zones/'+z.id+'/dns_records?per_page=100&page=1',token,fetcher,x=>Array.isArray(x)&&x.every(r=>r&&typeof r.id==='string'&&typeof r.type==='string'&&typeof r.name==='string'))
  ]);
  const info=zone.data?.result, list=records.data?.result, pagination=records.data?.result_info;
  return {name:z.name,zoneStatus:info?.status||'unavailable',paused:info?.paused??null,plan:info?.plan?.name??null,nameServers:info?.name_servers??null,
   coverage:{zone:zone.status,records:records.status},
   dnsRecords:list?list.slice(0,100).map(x=>({id:x.id,type:x.type,name:x.name,content:x.type==='TXT'?'[redacted]':x.content,proxied:x.proxied,ttl:x.ttl})):null,
   hasMore:!list?null:typeof pagination?.total_pages==='number'?pagination.total_pages>1:typeof pagination?.total_count==='number'?pagination.total_count>list.length:list.length>=100?null:false};
 })):Promise.resolve(zones.map(z=>({name:z.name,zoneStatus:'unverified',dnsRecords:null,coverage:{zone:'unconfigured',records:'unconfigured'},hasMore:null})));
 const [checks,result]=await Promise.all([checksPromise,inventoryPromise]);
 const publicCoverage={dns:aggregate(checks.flatMap(c=>[c.cname,c.a]).map(r=>r.status===0?'connected':'unavailable')),http:aggregate(checks.map(c=>c.http.reachable?'connected':'unavailable'))};
 const coverage={...publicCoverage,zones:token?aggregate(result.map(z=>z.coverage.zone)):'unconfigured',records:token?aggregate(result.map(z=>z.coverage.records)):'unconfigured',analytics:'not-implemented',security:'not-implemented'};
 // Public probes and credential validity cannot establish private inventory access.
 const privateStatus=connectionStatus(Object.fromEntries(result.flatMap((z,i)=>[[i+'zone',z.coverage.zone],[i+'records',z.coverage.records]])));
 return {status:token?privateStatus:Object.values(publicCoverage).some(x=>['connected','partial'].includes(x))?'partial':'error',mode:token?'api':'public-observation',checkedAt:new Date().toISOString(),zones:result,checks,coverage,
  reason:token?'Read-only zone and first-page DNS inventory. Coverage reports endpoint access, not zone health. Analytics and security monitoring are not implemented.':'Public DNS and HTTPS observations only; private zone inventory requires a scoped API token. HTTPS reachability does not prove application health.'};
}
