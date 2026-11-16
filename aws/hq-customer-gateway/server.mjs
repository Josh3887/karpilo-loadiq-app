import http from 'node:http';
import pg from 'pg';
import {createGatewayHandler} from './handler.mjs';
const required=['HQ_GATEWAY_DATABASE_URL','HQ_GATEWAY_BEARER_TOKEN','HQ_GATEWAY_RDS_CA_PEM'];
for(const name of required)if(!process.env[name])throw Error('Missing '+name);
const pool=new pg.Pool({connectionString:process.env.HQ_GATEWAY_DATABASE_URL,ssl:{rejectUnauthorized:true,ca:process.env.HQ_GATEWAY_RDS_CA_PEM},max:3,connectionTimeoutMillis:4000,idleTimeoutMillis:10000});
const handler=createGatewayHandler({token:process.env.HQ_GATEWAY_BEARER_TOKEN,query:async(q)=>{const client=await pool.connect();try{await client.query('BEGIN READ ONLY');await client.query("SET LOCAL statement_timeout = '5000ms'");const result=await client.query(q);await client.query('COMMIT');return result}catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}}});
const port=Number(process.env.PORT||3001);
http.createServer(handler).listen(port,'0.0.0.0');
