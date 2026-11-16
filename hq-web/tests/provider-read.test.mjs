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

test('restricted key authenticates all four reads without exposing credentials',async()=>{
 const keySid='SK'+'b'.repeat(32), secret='restricted-secret';let calls=0;
 const result=await readTwilio({...env,TWILIO_API_KEY_SID:keySid,TWILIO_API_KEY_SECRET:secret},async(url,options)=>{
  calls++;assert.equal(options.headers.Authorization,'Basic '+Buffer.from(keySid+':'+secret).toString('base64'));
  assert.ok(!options.method||options.method==='GET');
  const data=url.includes('Usage')?{usage_records:[]}:url.includes('Messages')?{messages:[]}:url.includes('verify.twilio')?{services:[]}:{sid,auth_token:'provider-master-secret'};
  return {ok:true,json:async()=>data};
 });
 assert.equal(calls,4);assert.equal(result.status,'connected');
 for(const value of [keySid,secret,'provider-master-secret'])assert.ok(!JSON.stringify(result).includes(value));
});
test('partial or malformed API keys never fall back to the account token',async()=>{
 let calls=0;const fetcher=async()=>{calls++;return {ok:false,status:401}};
 for(const fields of [{TWILIO_API_KEY_SID:'SK'+'b'.repeat(32)},{TWILIO_API_KEY_SECRET:'secret'},{TWILIO_API_KEY_SID:'AC'+'b'.repeat(32),TWILIO_API_KEY_SECRET:'secret'}]){
  const result=await readTwilio({...env,...fields},fetcher);assert.notEqual(result.status,'connected');
 }
 assert.equal(calls,0);
 const result=await readTwilio({...env,TWILIO_API_KEY_SID:'SK'+'b'.repeat(32),TWILIO_API_KEY_SECRET:'denied'},fetcher);
 assert.equal(result.status,'error');assert.equal(calls,4);
});
