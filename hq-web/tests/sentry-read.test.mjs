import test from 'node:test';
import assert from 'node:assert/strict';
import {readSentry,sentryOrganization} from '../lib/sentry-read.mjs';
const env={SENTRY_AUTH_TOKEN:'secret-fixture'};
function response(url){return url.includes('/projects/')?[{id:'1',slug:'karpilo-loadiq-isolated',platform:'javascript-nextjs',firstEvent:null,secret:'private'}]:url.includes('/issues/')?[{id:'2',shortId:'LOADIQ-4',project:{id:'1',slug:'karpilo-loadiq-isolated'},status:'unresolved',level:'error',count:'4',firstSeen:'2026-11-10T00:00:00Z',lastSeen:'2026-11-11T00:00:00Z',title:'private email person@example.com',culprit:'private',permalink:'https://evil.invalid',assignedTo:{email:'private'}}]:{id:'3',slug:sentryOrganization};}
test('Sentry missing token never calls provider',async()=>{assert.equal((await readSentry({},()=>{throw Error('network')})).status,'unconfigured')});
test('Sentry uses fixed bounded GETs and strips sensitive payloads',async()=>{
 let calls=0;const r=await readSentry(env,async(url,options)=>{calls++;if(url.includes('/issues/'))assert.equal(new URL(url).searchParams.get('project'),'4512353987133440');assert.equal(new URL(url).hostname,'sentry.io');assert.equal(options.headers.Authorization,'Bearer secret-fixture');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');assert.ok(!options.method||options.method==='GET');return {ok:true,json:async()=>response(url),headers:{get:()=>'<https://evil.invalid>; rel="next"; results="true"'}}});
 assert.equal(calls,3);assert.equal(r.status,'connected');assert.equal(r.issues[0].count,'4');assert.equal(r.pagination.issues,true);assert.equal(r.issues[0].url,'https://'+sentryOrganization+'.sentry.io/issues/2/');
 for(const value of ['private','evil.invalid','secret-fixture','person@example.com','assignedTo','culprit'])assert.ok(!JSON.stringify(r).includes(value));
});
test('Sentry issue denial remains partial with null issues',async()=>{
 const r=await readSentry(env,async url=>url.includes('/issues/')?{ok:false,status:403}:{ok:true,json:async()=>response(url)});
 assert.equal(r.status,'partial');assert.equal(r.coverage.issues,'access-denied');assert.equal(r.issues,null);
});
test('Sentry malformed data, foreign org and unsafe IDs are unavailable',async()=>{
 for(const data of [{id:'3',slug:'other'},[{id:'../bad',slug:'unsafe'}],{detail:'secret'}]){
 const r=await readSentry(env,async()=>({ok:true,json:async()=>data}));assert.equal(r.status,'error');assert.equal(r.projects,null);assert.equal(r.issues,null);
 }
});
test('Sentry distinguishes empty inventories and rate limits',async()=>{
 const r=await readSentry(env,async url=>({ok:true,json:async()=>url.endsWith('/')?{id:'3',slug:sentryOrganization}:[]}));assert.equal(r.status,'connected');assert.deepEqual(r.issues,[]);
 const limited=await readSentry(env,async()=>({ok:false,status:429}));assert.equal(limited.coverage.issues,'rate-limited');
 const failed=await readSentry(env,async()=>{throw Error('private')});assert.equal(failed.status,'error');assert.ok(!JSON.stringify(failed).includes('private'));
});
