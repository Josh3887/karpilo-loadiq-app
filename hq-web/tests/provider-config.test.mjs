import test from 'node:test';
import assert from 'node:assert/strict';
import {createConfigReader,selectProviderConfig} from '../lib/provider-config.mjs';
import {readRedis,readEia} from '../lib/operational-read.mjs';
import {createObservationCache} from '../lib/provider-cache.mjs';
test('secret allowlist excludes database, auth and unrelated fields',()=>{
 assert.deepEqual(selectProviderConfig({RESEND_API_KEY:'test',AWS_DATABASE_URL:'private',HQ_ADMIN_PASSWORD:'private',EIA_API_KEY:42}),{RESEND_API_KEY:'test'});
});
test('secret reads deduplicate, expire and respect env overrides',async()=>{
 let calls=0,time=0;const reader=createConfigReader(async()=>{calls++;return JSON.stringify({RESEND_API_KEY:'stored',AWS_DATABASE_URL:'private'})},()=>time);
 const env={HQ_PROVIDER_SECRET_ARN:'arn',RESEND_API_KEY:'override'};
 const results=await Promise.all([reader(env),reader(env)]);assert.equal(calls,1);assert.deepEqual(results[0],{RESEND_API_KEY:'override'});
 time=61000;await reader(env);assert.equal(calls,2);
});
test('credential failures remain errors without revealing provider exception',async()=>{
 const reader=createConfigReader(async()=>{throw Error('secret-value')});
 await assert.rejects(()=>reader({HQ_PROVIDER_SECRET_ARN:'arn'}),{message:'Provider configuration unavailable'});
});
test('Redis rejects arbitrary hosts, embedded credentials and redirects',async()=>{
 const token='private-token';let calls=0;const fetcher=async(url,options)=>{calls++;assert.equal(options.redirect,'error');return {ok:true,json:async()=>({result:'PONG'})}};
 for(const url of ['http://example.upstash.io','https://example.com','https://user:secret@example.upstash.io','https://example.upstash.io/ping','https://example.upstash.io?token=x'])assert.equal((await readRedis({UPSTASH_REDIS_REST_URL:url,UPSTASH_REDIS_REST_TOKEN:token},fetcher)).status,'error');
 assert.equal(calls,0);const result=await readRedis({UPSTASH_REDIS_REST_URL:'https://example.upstash.io',UPSTASH_REDIS_REST_TOKEN:token},fetcher);assert.equal(result.status,'connected');assert.ok(!JSON.stringify(result).includes(token));
});
test('Redis HTTP 200 with an error payload is not a connection',async()=>{
 assert.equal((await readRedis({UPSTASH_REDIS_REST_URL:'https://example.upstash.io',UPSTASH_REDIS_REST_TOKEN:'test'},async()=>({ok:true,json:async()=>({error:'denied'})}))).status,'error');
});
test('EIA requires valid dated diesel price and hides key',async()=>{
 const fetcher=async(url,options)=>{assert.equal(new URL(url).searchParams.get('length'),'1');assert.equal(options.headers.Authorization,undefined);return {ok:true,json:async()=>({response:{data:[{period:'2026-11-09',value:'3.50'}]}})}};
 const result=await readEia({EIA_API_KEY:'private-key'},fetcher);assert.equal(result.status,'connected');assert.equal(result.dieselPrice,3.5);assert.ok(!JSON.stringify(result).includes('private-key'));
 assert.equal((await readEia({EIA_API_KEY:'test'},async()=>({ok:true,json:async()=>({response:{data:[]}})}))).status,'error');
});
test('observation cache shares concurrent request and does not cache exceptions',async()=>{
 const cache=createObservationCache();let calls=0;const read=async()=>{calls++;return {status:'connected'}};
 await Promise.all([cache('x',read),cache('x',read)]);assert.equal(calls,1);
 await assert.rejects(()=>cache('bad',async()=>{throw Error()}));assert.equal((await cache('bad',read)).status,'connected');
});
