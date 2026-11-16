import test from 'node:test';
import assert from 'node:assert/strict';
import {createGatewayHandler} from './handler.mjs';
const token='a'.repeat(40);
async function invoke(path,authorization='Bearer '+token,query=async()=>({rows:[]})){
 let status,body;
 const res={writeHead(s){status=s},end(s){body=JSON.parse(s)}};
 await createGatewayHandler({token,query,logger:{error(){}}})({headers:{authorization},method:'GET',url:path},res);
 return {status,body};
}
test('empty database is connected empty page',async()=>assert.deepEqual(await invoke('/v1/hq/account-index?index=subscribers'),{status:200,body:{records:[],nextCursor:null}}));
test('reject unauthorized and unsupported index',async()=>{assert.equal((await invoke('/v1/hq/account-index?index=subscribers','Bearer wrong')).status,401);assert.equal((await invoke('/v1/hq/account-index?index=admin')).status,400)});
test('reject bad cursor',async()=>assert.equal((await invoke('/v1/hq/account-index?index=subscribers&cursor=%0A')).status,400));
test('paginate 101 records',async()=>{const r=await invoke('/v1/hq/account-index?index=vehicles',undefined,async()=>({rows:Array.from({length:101},(_,i)=>({id:i}))}));assert.equal(r.status,200);assert.equal(r.body.records.length,100);assert.ok(r.body.nextCursor)});
test('database failure is 503 not empty success',async()=>assert.equal((await invoke('/v1/hq/account-index?index=subscribers',undefined,async()=>{throw Error('offline')})).status,503));
