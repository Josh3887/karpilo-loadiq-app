import test from 'node:test';
import assert from 'node:assert/strict';
import {readMail,productAddress} from '../lib/resend-mail.mjs';
import {editTemplate} from '../lib/resend-edit.mjs';
import {normalizeAttachments} from '../lib/resend-send.mjs';
import {boundedJSON} from '../lib/request-json.mjs';
import {integrationAlarms} from '../lib/integration-alarms.mjs';
const env={RESEND_API_KEY:'private-fixture'},ok=data=>({ok:true,json:async()=>data});
test('mailbox scope excludes other projects and preserves provider pagination',async()=>{
 const r=await readMail(env,{},async()=>ok({data:[{id:'a',from:'LoadIQ <team@karpilo-liq.com>',to:['a@example.com']},{id:'b',from:'team@karpiloendeavor.com'}],has_more:true}));
 assert.deepEqual(r.messages.map(m=>m.id),['a']);assert.equal(r.nextCursor,'b');assert.equal(productAddress('x@karpilo-liq.com.evil.test'),false);
 assert.equal((await readMail(env,{id:'b'},async()=>ok({id:'b',from:'team@karpiloendeavor.com',html:'private'}))).status,'unavailable');
 const received=await readMail(env,{folder:'inbox',id:'a'},async()=>ok({id:'a',from:'someone@example.com',to:['support@karpilo-liq.com'],text:'hello',headers:{secret:'secret'}}));assert.equal(received.message.text,'hello');assert.ok(!JSON.stringify(received).includes('secret'));
});
test('attachments are bounded and reject URL paths, executables and malformed base64',()=>{
 assert.deepEqual(normalizeAttachments([{filename:'image.png',content:'aGVsbG8='}]),[{filename:'image.png',content:'aGVsbG8='}]);
 for(const a of [[{filename:'a.exe',content:'aGVsbG8='}],[{filename:'../a.png',content:'aGVsbG8='}],[{filename:'a.pdf',path:'https://internal'}],[{filename:'a.pdf',content:'%%%'}],Array.from({length:6},()=>({filename:'a.pdf',content:'aGVsbG8='})),[{filename:'a.pdf',content:Buffer.alloc(2*1024*1024+1).toString('base64')}]] )assert.throws(()=>normalizeAttachments(a));
});
test('template edits require review, current version, product sender and preserve publication',async()=>{
 const template={id:'t',name:'LoadIQ Welcome',status:'published',current_version_id:'v1',from:'welcome@karpilo-liq.com',subject:'hello',html:'<p>Hello</p>',variables:[]};
 const input={id:'t',version:'v1',confirmed:true,name:'LoadIQ Welcome',subject:'updated',html:'<p>Updated</p>'};
 let writes=0;const mock=async(url,opts)=>{if(opts.method==='PATCH'){writes++;const body=JSON.parse(opts.body);assert.deepEqual(Object.keys(body).sort(),['html','name','subject']);assert.equal(opts.redirect,'error');return ok({id:'t'})}return ok(template)};
 assert.equal((await editTemplate(env,{...input,confirmed:false},mock)).status,'invalid-request');
 assert.equal((await editTemplate(env,{...input,version:'old'},mock)).status,'blocked');
 assert.equal((await editTemplate(env,{...input,html:'{{{UNDECLARED}}}'},mock)).status,'blocked');
 assert.equal(writes,0);assert.equal((await editTemplate(env,input,mock)).status,'saved');assert.equal(writes,1);
 assert.equal((await editTemplate(env,input,async()=>ok({...template,from:'other@example.com'}))).status,'blocked');
});
test('bounded JSON rejects oversize bodies before parsing',async()=>{
 const req=value=>new Request('https://hq.example.test',{method:'POST',body:value});
 assert.deepEqual(await boundedJSON(req('{"ok":true}'),20),{ok:true});
 await assert.rejects(boundedJSON(req('x'.repeat(100)),20),/too-large/);
 await assert.rejects(boundedJSON(req('{'),20),/invalid-json/);
});
test('alarm cards distinguish monitoring gaps, failures and setup',()=>{
 const now=Date.now(),r=integrationAlarms({entries:[{name:'Unconfigured',status:'unconfigured'},{name:'Failure',status:'access-denied'},{name:'Stale',status:'connected',checkedAt:new Date(now-3600000).toISOString()}],posthog:{project:{id:1,ingestedEvent:false}},awsOperations:{status:'connected',alarms:[{name:'CPU',state:'ALARM'}]}},now);
 assert.equal(r.some(a=>a.provider==='Unconfigured'),false);assert.equal(r.filter(a=>a.severity==='critical').length,2);assert.equal(r.some(a=>a.id==='posthog-ingestion'),true);assert.equal(r.some(a=>a.id==='stale-Stale'),true);
});
