import test from 'node:test';
import assert from 'node:assert/strict';
import {readVercelTraffic,surfaces} from '../lib/vercel-traffic.mjs';
const now=Date.parse('2026-11-16T05:30:00Z');
test('traffic stays project scoped and excludes incomplete hour',async()=>{const calls=[];const r=await readVercelTraffic({VERCEL_TOKEN:'test'},'24h',async(u,o)=>{calls.push(JSON.parse(o.body));return new Response(JSON.stringify({data:[{timestamp:'2026-11-16T04:00:00Z',vercel_request_count_sum:2}]}))},now);assert.equal(r.status,'connected');assert.deepEqual(calls.map(c=>c.scope.projectIds[0]),surfaces.map(s=>s[1]));assert.ok(calls.every(c=>c.endTime==='2026-11-16T05:00:00.000Z'));assert.equal(r.series.length,2)});
test('denied website is not replaced with HQ traffic',async()=>{const r=await readVercelTraffic({VERCEL_TOKEN:'test'},'24h',async(u,o)=>JSON.parse(o.body).scope.projectIds[0]===surfaces[0][1]?new Response('{}',{status:403}):new Response(JSON.stringify({data:[]})),now);assert.equal(r.status,'partial');assert.equal(r.series.length,1);assert.equal(r.coverage[0].status,'access-denied')});
test('malformed traffic is not a measured zero',async()=>{const r=await readVercelTraffic({VERCEL_TOKEN:'test'},'24h',async()=>new Response(JSON.stringify({data:[{timestamp:'bad',vercel_request_count_sum:-1}]})),now);assert.equal(r.status,'unavailable');assert.deepEqual(r.series,[])});
