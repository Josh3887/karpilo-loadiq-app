import test from 'node:test';import assert from 'node:assert/strict';
import {createLambdaHandler,parseProviderConfig} from './lambda-handler.mjs';import {identity} from './access.mjs';
const claims={sub:'operator',client_id:identity.client,token_use:'access',iss:`https://cognito-idp.us-east-2.amazonaws.com/${identity.pool}`};
const hold={RESEND_ENABLED:'false',RESEND_BILLING_ALERTS_ENABLED:'false',AWS_COMMUNICATIONS_ENABLED:'true'};
const event=(path='/v1/analytics',method='GET',auth=true)=>({rawPath:path,rawQueryString:'',requestContext:{http:{method}},headers:auth?{authorization:'Bearer test'}:{}});
test('gateway denies unauthorized users before credentials or providers are accessed',async()=>{
 let reads=0;const h=createLambdaHandler({verify:async()=>claims,allowedSubjects:new Set(),env:hold,getConfig:async()=>{reads++;return{};}});
 assert.equal((await h(event())).statusCode,403);assert.equal((await h(event('/v1/analytics','GET',false))).statusCode,401);assert.equal(reads,0);
});
test('gateway rejects every write and requires explicit email-off settings',async()=>{
 const options={verify:async()=>claims,allowedSubjects:new Set(['operator']),getConfig:async()=>{throw Error('must not read');}};
 const h=createLambdaHandler({...options,env:hold});for(const method of ['POST','PUT','PATCH','DELETE'])assert.equal((await h(event('/v1/templates',method))).statusCode,405);
 assert.equal((await createLambdaHandler({...options,env:{}})(event('/v1/session'))).statusCode,503);
});
test('gateway returns normalized provider data and reuses credential cache',async()=>{
 let reads=0;const h=createLambdaHandler({verify:async()=>claims,allowedSubjects:new Set(['operator']),env:hold,getConfig:async()=>{reads++;return{HQ_RESEND_TOKEN:'private'};},fetcher:async()=>Response.json({data:[{name:'example.invalid',status:'verified'}]})});
 const first=await h(event());assert.equal(first.statusCode,200);assert.equal(JSON.parse(first.body).emailSending,false);assert.ok(!first.body.includes('private'));await h(event());assert.equal(reads,1);
 assert.equal((await h(event('/v1/conversations'))).statusCode,503);
});
test('provider secret cannot override delivery holds or arbitrary endpoints',()=>{
 const config=parseProviderConfig('{"HQ_RESEND_TOKEN":"private","RESEND_ENABLED":"true","baseUrl":"https://attacker.invalid"}');assert.deepEqual(config,{HQ_RESEND_TOKEN:'private'});
 assert.throws(()=>parseProviderConfig('[]'));assert.throws(()=>parseProviderConfig('{"HQ_RESEND_TOKEN":true}'));
});
