import {readJSON} from './provider-read.mjs';
const stamp=()=>new Date().toISOString();
export async function readRedis(env,fetcher=fetch){
 const missing=['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'].filter(k=>!env[k]);
 if(missing.length)return {status:'unconfigured',missingCredentials:missing,checkedAt:null};
 let url;
 try{url=new URL(env.UPSTASH_REDIS_REST_URL);if(url.protocol!=='https:'||!url.hostname.endsWith('.upstash.io')||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash)throw Error()}catch{return {status:'error',reason:'Redis endpoint must be a standard HTTPS Upstash endpoint.',checkedAt:stamp()}};
 const started=Date.now();
 const r=await readJSON(new URL('/ping',url).toString(),'Bearer '+env.UPSTASH_REDIS_REST_TOKEN,fetcher);
 return {status:r.status==='connected'?(r.data?.result==='PONG'?'connected':'error'):r.status,checkedAt:stamp(),httpStatus:r.httpStatus??null,latencyMs:Date.now()-started,note:'Read-only PING; storage, invoices and customer keys are not inspected.'};
}
export async function readEia(env,fetcher=fetch){
 if(!env.EIA_API_KEY)return {status:'unconfigured',missingCredentials:['EIA_API_KEY'],checkedAt:null};
 const url=new URL('https://api.eia.gov/v2/petroleum/pri/gnd/data/');
 Object.entries({'api_key':env.EIA_API_KEY,frequency:'weekly','data[0]':'value','facets[series][]':'EMD_EPD2DXL0_PTE_NUS_DPG','sort[0][column]':'period','sort[0][direction]':'desc',offset:'0',length:'1'}).forEach(([k,v])=>url.searchParams.set(k,v));
 const r=await readJSON(url.toString(),null,fetcher),row=r.data?.response?.data?.[0];
 const valid=typeof row?.period==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(row.period)&&Number.isFinite(Number(row.value))&&Number(row.value)>0;
 return {status:r.status==='connected'?(valid?'connected':'error'):r.status,checkedAt:stamp(),httpStatus:r.httpStatus??null,latestPeriod:valid?row.period:null,dieselPrice:valid?Number(row.value):null,units:valid?'USD per gallon':null,note:'U.S. weekly retail diesel reference; published period is separate from connection time.'};
}
