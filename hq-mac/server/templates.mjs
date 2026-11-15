import {AccessError} from './access.mjs';
export function createTemplates(env, fetcher=fetch) {
 async function get(path) {
  if(!env.HQ_RESEND_TOKEN) throw new AccessError(503,'Resend read credentials are not configured');
  const response=await fetcher(new URL(path,'https://api.resend.com'),{method:'GET',redirect:'error',headers:{Authorization:`Bearer ${env.HQ_RESEND_TOKEN}`,Accept:'application/json'},signal:AbortSignal.timeout(10000)});
  if(!response.ok) throw new AccessError(503,response.status===401||response.status===403?'Resend read access denied':'Resend is unavailable');
  const reader=response.body?.getReader();if(!reader)throw new AccessError(503,'Resend returned no body');
  let size=0;const chunks=[];
  try { while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2000000){await reader.cancel();throw new AccessError(503,'Template response exceeds size limit');}chunks.push(value);} }
  finally{reader.releaseLock();}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
 }
 return {
  async list(after) {
   if(after&&!/^[a-zA-Z0-9_-]{1,128}$/.test(after))throw new AccessError(400,'Invalid template cursor');
   const result=await get(`/templates?limit=100${after?'&after='+encodeURIComponent(after):''}`);
   if(!Array.isArray(result.data))throw new AccessError(503,'Resend returned an invalid catalog');
   return {source:'resend',observedAt:new Date().toISOString(),has_more:!!result.has_more,data:result.data.map(t=>({id:t.id,alias:t.alias??t.id,name:t.name,status:t.status,subject:t.subject??'',channel:'unmapped',variables:[]}))};
  },
  async read(id) {
   if(!/^[a-zA-Z0-9_-]{1,128}$/.test(id))throw new AccessError(400,'Invalid template identifier');
   const t=await get('/templates/'+encodeURIComponent(id));
   if(typeof t.html!=='string')throw new AccessError(503,'Template body unavailable');
   return {id:t.id,alias:t.alias??t.id,name:t.name,status:t.status,subject:t.subject??'',html:t.html,variables:Array.isArray(t.variables)?t.variables.map(v=>typeof v==='string'?v:v.key).filter(v=>typeof v==='string'):[]};
  }
 };
}
