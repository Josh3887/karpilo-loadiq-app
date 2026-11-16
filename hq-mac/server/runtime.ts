// Deploy beside the audited AWS app checkout; never use subscriber authentication here.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { supportService } from '../../work/inbox-release/src/server/aws-backend/support-service';
import { postgresDatabase } from '../../work/inbox-release/src/server/aws-backend/database';
import { createRouter, identity } from './access.mjs';
import { createAnalytics } from './analytics.mjs';
import { createTemplates } from './templates.mjs';
const require = createRequire(new URL('../../work/inbox-release/package.json',import.meta.url));
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const verifier=CognitoJwtVerifier.create({userPoolId:identity.pool,clientId:identity.client,tokenUse:'access'});
const allowedSubjects=new Set((process.env.HQ_OPERATOR_SUBJECTS??'').split(',').filter(Boolean));
if(!allowedSubjects.size)throw new Error('Explicit operator enrollment required');
if(process.env.RESEND_ENABLED!=='false'||process.env.RESEND_BILLING_ALERTS_ENABLED!=='false'||process.env.AWS_COMMUNICATIONS_ENABLED!=='true')throw new Error('Explicit email hold required');
const router=createRouter({verify:(token:string)=>verifier.verify(token),allowedSubjects,support:(actor:string)=>supportService(postgresDatabase('support'),actor),analytics:createAnalytics(process.env),templates:createTemplates(process.env),env:process.env});
const limits=new Map<string,{count:number;until:number}>();
const server=createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 const peer=req.socket.remoteAddress??'unknown';const now=Date.now();
 for(const [key,value]of limits)if(value.until<now)limits.delete(key);
 const bucket=limits.get(peer)??{count:0,until:now+60000};bucket.count++;limits.set(peer,bucket);
 if(bucket.count>120){res.writeHead(429);res.end();return;}
 try{
  let size=0;const chunks:Buffer[]=[];
  for await(const chunk of req){size+=chunk.length;if(size>16384){res.writeHead(413);res.end();return;}chunks.push(chunk);}
  const method=req.method??'GET';
  const headers=new Headers();for(const [key,value]of Object.entries(req.headers))if(typeof value==='string')headers.set(key,value);
  const request=new Request(new URL(req.url??'/', 'http://localhost:8130'),{method,headers,...(!['GET','HEAD'].includes(method)?{body:Buffer.concat(chunks)}:{})});
  const reply=await router(request);res.writeHead(reply.status,Object.fromEntries(reply.headers));res.end(await reply.text());
 }catch{res.writeHead(503);res.end('{"error":"HQ service unavailable"}');}
});
server.requestTimeout=15000;server.headersTimeout=10000;
server.listen(8130,'127.0.0.1');
