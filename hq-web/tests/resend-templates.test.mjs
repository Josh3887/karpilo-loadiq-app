import test from 'node:test';
import assert from 'node:assert/strict';
import {getTemplate,listTemplates,fillTemplate,variableValues,publicationLabel,templateCategory} from '../lib/resend-templates.mjs';
import {sendTemplateMessage} from '../lib/resend-send.mjs';
const env={RESEND_API_KEY:'private-token'};
const template={id:'test-template',current_version_id:'version-1',name:'Welcome',status:'published',from:'Welcome <welcome@example.com>',subject:'Welcome',html:'<p>{{{NAME}}}</p>',text:'Hi {{{NAME}}}',variables:[{key:'NAME',type:'string',fallback_value:null}],has_unpublished_versions:false};
const ok=data=>({ok:true,json:async()=>data});
const input={templateId:template.id,version:'version-1',to:'recipient@example.com',variables:{NAME:'Person'},requestId:'request-1234567890',confirmed:true};
test('template inventory supports pagination without inventing content',async()=>{
 const r=await listTemplates(env,'last-template',async(url,options)=>{assert.ok(url.endsWith('after=last-template'));assert.equal(options.redirect,'error');return ok({data:[template],has_more:true})});assert.equal(r.templates.length,1);assert.equal(r.nextCursor,'test-template');assert.equal(r.templates[0].html,undefined);
});
test('invalid template IDs and missing credentials make no network request',async()=>{
 const noCall=()=>{throw Error('must not call')};assert.equal((await getTemplate(env,'../../emails',noCall)).status,'invalid-request');assert.equal((await listTemplates({},'',noCall)).status,'unconfigured');
});
test('details normalize only template fields and reject malformed bodies',async()=>{
 const r=await getTemplate(env,template.id,async()=>ok({...template,secret:'private-data'}));assert.equal(r.template.version,'version-1');assert.equal(r.template.variables[0].key,'NAME');assert.ok(!JSON.stringify(r).includes('private-data'));
 assert.equal((await getTemplate(env,template.id,async()=>ok({...template,variables:{}}))).status,'unavailable');
 assert.equal((await getTemplate(env,template.id,async()=>({ok:false,status:403}))).status,'access-denied');
});
test('template identity is distinct from publication and superseded state',()=>{
 assert.equal(publicationLabel('draft'),'Unpublished');assert.equal(templateCategory({name:'SUPERSEDED — old welcome'}),'Superseded');assert.equal(templateCategory({name:'Trial 5 of 5 — Karpilo LoadIQ Snapshot'}),'Load intelligence');
});
test('personalization preserves missing placeholders and escapes HTML',()=>{
 assert.equal(fillTemplate('<p>{{{NAME}}}</p>',{NAME:'<script>&"'},true),'<p>&lt;script&gt;&amp;&quot;</p>');assert.equal(fillTemplate('{{{MISSING}}}',{}),'{{{MISSING}}}');
 assert.deepEqual(variableValues({...template,variables:[{key:'NAME',type:'string',fallback:'Fallback'},{key:'COUNT',type:'number',fallback:0}]},{}),{values:{NAME:'Fallback',COUNT:0},missing:[]});
 assert.deepEqual(variableValues({variables:[{key:'COUNT',type:'number',fallback:null}]},{COUNT:'invalid'}).missing,['COUNT']);
});
test('send requires confirmed review, recipient and current published content',async()=>{
 let sends=0;const mock=async(url)=>{if(url.endsWith('/emails'))sends++;return ok({...template,status:'draft'})};
 assert.equal((await sendTemplateMessage(env,{...input,confirmed:false},mock)).status,'invalid-request');
 assert.equal((await sendTemplateMessage(env,{...input,to:'a@example.com\r\nBcc:bad@example.com'},mock)).status,'invalid-request');
 assert.equal((await sendTemplateMessage(env,input,mock)).status,'blocked');
 assert.equal((await sendTemplateMessage(env,input,async()=>ok({...template,current_version_id:'version-2'}))).status,'blocked');
 assert.equal((await sendTemplateMessage(env,input,async()=>ok({...template,has_unpublished_versions:true}))).status,'blocked');assert.equal(sends,0);
});
test('only declared variables, exact template sender and stable idempotency reach send API',async()=>{
 const seen=[];const mock=async(url,options)=>{if(!url.endsWith('/emails'))return ok(template);seen.push(options);return ok({id:'accepted-id'})};
 const data={...input,from:'forged@example.com',html:'bad',variables:{NAME:'Person',EXTRA:'ignored'}};
 const r=await sendTemplateMessage(env,data,mock);await sendTemplateMessage(env,data,mock);
 assert.equal(r.status,'accepted');assert.equal(r.id,'accepted-id');assert.equal(seen[0].headers['Idempotency-Key'],seen[1].headers['Idempotency-Key']);
 const p=JSON.parse(seen[0].body);assert.equal(p.from,template.from);assert.equal(p.html,undefined);assert.deepEqual(p.template.variables,{NAME:'Person'});assert.equal(seen[0].redirect,'error');assert.ok(!JSON.stringify(r).includes('private-token'));
});
test('ambiguous send timeout never claims delivered or accepted',async()=>{
 const r=await sendTemplateMessage(env,input,async(url)=>{if(url.endsWith('/emails'))throw Error('private-error');return ok(template)});assert.equal(r.status,'unknown');assert.ok(!JSON.stringify(r).includes('private-error'));
});

test('undeclared placeholders cannot be sent as customer-facing content',async()=>{
 const r=await sendTemplateMessage(env,input,async()=>ok({...template,html:'Hi {{{FIRST_NAME}}}'}));assert.equal(r.status,'blocked');assert.ok(r.reason.includes('FIRST_NAME'));
});
