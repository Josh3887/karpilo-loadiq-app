import test from 'node:test';import assert from 'node:assert/strict';import {createTemplates} from './templates.mjs';
test('template reads require server credentials and never send',async()=>{
 await assert.rejects(()=>createTemplates({}).list(),/not configured/);
 const paths=[];const api=createTemplates({HQ_RESEND_TOKEN:'private'},async(url,options)=>{assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.equal(url.host,'api.resend.com');paths.push(url.pathname);return Response.json(url.pathname==='/templates'?{data:[{id:'one',alias:'welcome',name:'Welcome',status:'draft',secret:'private'}],has_more:false}:{id:'one',name:'Welcome',html:'<html>hello</html>',variables:[{key:'NAME'}]});});
 const catalog=await api.list();assert.equal(catalog.data[0].subject,'');assert.ok(!JSON.stringify(catalog).includes('private'));
 const body=await api.read('one');assert.deepEqual(body.variables,['NAME']);assert.deepEqual(paths,['/templates','/templates/one']);
 await assert.rejects(()=>api.read('../emails'),/Invalid/);
});
test('oversized template responses are stopped',async()=>{const api=createTemplates({HQ_RESEND_TOKEN:'private'},async()=>new Response('a'.repeat(2000001)));await assert.rejects(()=>api.read('one'),/size limit/);});
