import test from 'node:test';
import assert from 'node:assert/strict';
import {readCloudflare,zones} from '../lib/cloudflare-read.mjs';
const env={CLOUDFLARE_API_TOKEN:'private-token'};
const ok=data=>({ok:true,status:200,json:async()=>data});
function mock(override){return async(url,options)=>{
 if(url.startsWith('https://api.cloudflare.com/')){
  assert.equal(options.headers.Authorization,'Bearer private-token');
  assert.equal(options.redirect,'error');
  assert.equal(options.cache,'no-store');
  if(override){const r=override(url);if(r)return r;}
  const z=zones.find(z=>url.includes(z.id));assert.ok(z);
  return ok({success:true,result:url.includes('dns_records')?[{id:'record',name:z.name,type:'TXT',content:'private-dns-value',comment:'private-comment'}]:{id:z.id,name:z.name,status:'active',owner:{email:'private-owner'}},result_info:{total_pages:2}});
 }
 assert.equal(options.headers?.Authorization,undefined);
 if(url.startsWith('https://cloudflare-dns.com/'))return ok({Status:0,Answer:[]});
 assert.equal(options.method,'HEAD');return {status:401,headers:{get:()=>null}};
};}
test('public observation never claims private connectivity',async()=>{
 const r=await readCloudflare({},async(url,options)=>{assert.ok(!url.startsWith('https://api.cloudflare.com/'));return mock()(url,options)});
 assert.equal(r.status,'partial');assert.equal(r.coverage.zones,'unconfigured');
});
test('validated inventories connect, redact and disclose pagination',async()=>{
 const r=await readCloudflare(env,mock());assert.equal(r.status,'connected');
 assert.equal(r.zones[0].hasMore,true);assert.equal(r.zones[0].dnsRecords[0].content,'[redacted]');
 for(const value of ['private-token','private-dns-value','private-comment','private-owner'])assert.ok(!JSON.stringify(r).includes(value));
 assert.equal(r.coverage.analytics,'not-implemented');
});
test('denied private scopes remain errors despite successful public probes',async()=>{
 const r=await readCloudflare(env,mock(()=>({ok:false,status:403})));
 assert.equal(r.status,'error');assert.equal(r.coverage.zones,'access-denied');assert.equal(r.coverage.http,'connected');assert.equal(r.zones[0].dnsRecords,null);
});
test('denied records remain partial for the product zone',async()=>{
 const r=await readCloudflare(env,mock(url=>url.includes('dns_records')?{ok:false,status:403}:null));
 assert.equal(r.status,'partial');assert.equal(r.zones.length,1);assert.equal(r.zones[0].name,'karpilo-liq.com');assert.equal(r.zones[0].coverage.records,'access-denied');
});
test('malformed API success and rate limits cannot become empty inventories',async()=>{
 const bad=await readCloudflare(env,mock(()=>ok({success:true,result:{}})));
 assert.equal(bad.status,'error');assert.equal(bad.zones[0].dnsRecords,null);
 const limited=await readCloudflare(env,mock(()=>({ok:false,status:429})));
 assert.equal(limited.coverage.records,'rate-limited');
});
test('empty valid DNS inventory is distinct from failed inventory',async()=>{
 const r=await readCloudflare(env,mock(url=>url.includes('dns_records')?ok({success:true,result:[],result_info:{total_pages:1}}):null));
 assert.equal(r.status,'connected');assert.deepEqual(r.zones[0].dnsRecords,[]);assert.equal(r.zones[0].hasMore,false);
});
test('public failures are reported even when private APIs connect',async()=>{
 const good=mock();const r=await readCloudflare(env,async(url,options)=>{if(!url.startsWith('https://api.cloudflare.com/'))throw Error('private-error');return good(url,options)});
 assert.equal(r.status,'connected');assert.equal(r.coverage.dns,'unavailable');assert.equal(r.coverage.http,'unavailable');assert.ok(!JSON.stringify(r).includes('private-error'));
});
