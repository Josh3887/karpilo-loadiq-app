// Per warm server instance; no background polling and no credential values in cache keys.
export function createObservationCache(ttl=60000){
 const entries=new Map();
 return async(key,read)=>{
  const previous=entries.get(key);
  if(previous?.expires>Date.now())return previous.value;
  if(previous?.pending)return previous.pending;
  const pending=Promise.resolve().then(read).then(value=>{entries.set(key,{value,expires:Date.now()+(value?.status&&!['connected','partial'].includes(value.status)?Math.min(ttl,15000):ttl)});return value}).catch(error=>{entries.delete(key);throw error});
  entries.set(key,{pending});return pending;
 };
}
