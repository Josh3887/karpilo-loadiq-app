import test from 'node:test';
import assert from 'node:assert/strict';
import {readTwilio} from '../lib/twilio-read.mjs';
import {readJSON} from '../lib/provider-read.mjs';
const sid='AC'+'a'.repeat(32), env={TWILIO_ACCOUNT_SID:sid,TWILIO_AUTH_TOKEN:'private-token'};
test('missing keys and malformed SIDs never call provider',async()=>{
 const noCall=()=>{throw Error('must not call')};
 assert.equal((await readTwilio({},noCall)).status,'unconfigured');
 assert.equal((await readTwilio({...env,TWILIO_ACCOUNT_SID:'../bad'},noCall)).status,'error');
});
test('normalizes all scopes and redacts sensitive response fields',async()=>{
 const r=await readTwilio(env,async(url,options)=>{
 assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');
 const data=url.includes('Usage')?{usage_records:[{category:'sms',price:'1.25'}],next_page_uri:'/more'}:url.includes('Messages')?{messages:[{sid:'SM1',body:'private-body',to:'+15555555555',error_code:30003}]}:url.includes('verify.twilio')?{services:[{sid:'VA1',friendly_name:'HQ'}],meta:{next_page_url:'https://untrusted.invalid'}}:{sid,auth_token:'private-token'};
 return {ok:true,json:async()=>data};});
 assert.equal(r.status,'connected');assert.equal(r.messages[0].errorCode,30003);assert.equal(r.pagination.usage,true);
 for(const secret of ['private-body','+15555555555','private-token','untrusted.invalid'])assert.ok(!JSON.stringify(r).includes(secret));
});
test('scope denial is partial and does not become an empty successful list',async()=>{
 const r=await readTwilio(env,async url=>url.endsWith(sid+'.json')?{ok:true,json:async()=>({sid})}:{ok:false,status:403});
 assert.equal(r.status,'partial');assert.equal(r.usage,null);assert.equal(r.coverage.usage,'access-denied');
});
test('malformed JSON shape cannot be presented as zero inventory',async()=>{
 const r=await readTwilio(env,async()=>({ok:true,json:async()=>({})}));assert.equal(r.status,'error');assert.equal(r.messages,null);
});
test('provider errors and rate limits expose no error bodies',async()=>{
 assert.equal((await readJSON('https://example.test','secret',async()=>({ok:false,status:429}))).status,'rate-limited');
 assert.deepEqual(await readJSON('https://example.test','secret',async()=>{throw Error('secret')}),{status:'unavailable',data:null});
});
