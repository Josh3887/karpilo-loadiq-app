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
 const r=await readJSON(url.toString(),null,fetcher,20000),row=r.data?.response?.data?.[0];
 const valid=typeof row?.period==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(row.period)&&Number.isFinite(Number(row.value))&&Number(row.value)>0;
 return {status:r.status==='connected'?(valid?'connected':'error'):r.status,checkedAt:stamp(),httpStatus:r.httpStatus??null,latestPeriod:valid?row.period:null,dieselPrice:valid?Number(row.value):null,units:valid?'USD per gallon':null,note:'U.S. weekly retail diesel reference; published period is separate from connection time.'};
}
export async function readStripeTest(env,fetcher=fetch){
 const token=env.STRIPE_TEST_SECRET_KEY;
 const base={mode:'test',note:'Stripe test-mode API only; this does not verify live payments, billing lifecycle or webhook delivery.',checkedAt:stamp()};
 if(!token)return {...base,status:'unconfigured',missingCredentials:['STRIPE_TEST_SECRET_KEY']};
 if(!/^[sr]k_test_/.test(token))return {...base,status:'error',reason:'Only a Stripe test key is accepted by this observation.'};
 const r=await readJSON('https://api.stripe.com/v1/balance','Basic '+Buffer.from(token+':').toString('base64'),async(url,options)=>fetcher(url,{...options,headers:{...options.headers,'Stripe-Version':'2026-10-28.endive'}}));
 const valid=r.data?.object==='balance'&&r.data.livemode===false&&Array.isArray(r.data.available)&&Array.isArray(r.data.pending);
 return {...base,status:r.status==='connected'?(valid?'connected':'error'):r.status,httpStatus:r.httpStatus??null};
}
