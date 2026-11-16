import test from 'node:test';
import assert from 'node:assert/strict';
import {readPosthog,posthogOrganization} from '../lib/posthog-read.mjs';
const env={POSTHOG_PERSONAL_API_KEY:'secret-fixture',POSTHOG_HOST:'https://us.posthog.com',POSTHOG_PROJECT_ID:'447918'};
const payload=url=>url.includes('/organizations/')?{id:447918,organization:posthogOrganization,name:'Default project',timezone:'UTC',ingested_event:false,api_token:'private-token'}:{results:[{id:1,name:'Inventory',created_at:'2026-11-01T00:00:00Z',created_by:{email:'private@example.com'},query:{private:'private-query'},result:'private-series'}],next:null};
test('PostHog configuration fails closed without sending credentials',async()=>{
 for(const changed of [{POSTHOG_PERSONAL_API_KEY:''},{POSTHOG_HOST:'https://us.posthog.com.evil.invalid'},{POSTHOG_HOST:'https://user@us.posthog.com'},{POSTHOG_HOST:'https://us.posthog.com/other'},{POSTHOG_HOST:'https://us.posthog.com?token=x'},{POSTHOG_PROJECT_ID:'../other'},{POSTHOG_PROJECT_ID:'9007199254740992'}]){
 let calls=0;const r=await readPosthog({...env,...changed},()=>{calls++;throw Error()});assert.notEqual(r.status,'connected');assert.equal(calls,0);
 }
});
test('PostHog bounded GETs redact credentials and private payloads',async()=>{
 const urls=[];const r=await readPosthog(env,async(url,o)=>{urls.push(url);assert.equal(new URL(url).origin,env.POSTHOG_HOST);assert.equal(o.headers.Authorization,'Bearer secret-fixture');assert.equal(o.redirect,'error');assert.equal(o.cache,'no-store');assert.ok(!o.method||o.method==='GET');return {ok:true,json:async()=>payload(url)}});
 assert.equal(urls.length,3);assert.ok(urls.some(u=>u.endsWith('saved=true&basic=true&refresh=force_cache')));assert.equal(r.status,'connected');assert.equal(r.project.ingestedEvent,false);
 for(const v of ['private-token','private@example.com','private-query','private-series','secret-fixture'])assert.ok(!JSON.stringify(r).includes(v));
});
test('PostHog partial denial is not an empty successful inventory',async()=>{
 const r=await readPosthog(env,async u=>u.includes('/insights/')?{ok:false,status:403}:{ok:true,json:async()=>payload(u)});assert.equal(r.status,'partial');assert.equal(r.coverage.insights,'access-denied');assert.equal(r.insights,null);
});
test('PostHog validates identity and collection shapes',async()=>{
 for(const data of [{id:2,organization:posthogOrganization,name:'Wrong'}, {results:[{id:'../escape'}],next:null}, {results:[],next:42}, {detail:'private'}]){
 const r=await readPosthog(env,async()=>({ok:true,json:async()=>data}));assert.equal(r.status,'error');assert.equal(r.project,null);assert.equal(r.insights,null);
 }
});
test('PostHog empty inventories and unknown ingestion remain distinct',async()=>{
 const r=await readPosthog(env,async u=>({ok:true,json:async()=>u.includes('/organizations/')?{...payload(u),ingested_event:undefined}:{results:[],next:null}}));assert.equal(r.status,'connected');assert.equal(r.project.ingestedEvent,null);assert.deepEqual(r.insights,[]);
});
test('PostHog pagination never follows external URLs and limits rows',async()=>{
 let calls=0;const r=await readPosthog(env,async u=>{calls++;return {ok:true,json:async()=>u.includes('/organizations/')?payload(u):{results:Array.from({length:51},(_,i)=>({id:i+1,name:'row'})),next:'https://evil.invalid/secret'}}});assert.equal(calls,3);assert.equal(r.dashboards.length,50);assert.equal(r.pagination.dashboards,true);assert.ok(!JSON.stringify(r).includes('evil.invalid'));
});
test('PostHog rate limits and errors remain explicit and redacted',async()=>{
 const limited=await readPosthog(env,async()=>({ok:false,status:429}));assert.equal(limited.coverage.project,'rate-limited');
 const failed=await readPosthog(env,async()=>{throw Error('private-failure')});assert.equal(failed.status,'error');assert.ok(!JSON.stringify(failed).includes('private-failure'));
});
