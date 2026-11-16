import {readJSON} from './provider-read.mjs';
import {twilioMissingCredentials} from './twilio-read.mjs';
export async function readTwilioMonitoring(env,range,fetcher=fetch,now=Date.now()) {
 const base={checkedAt:new Date(now).toISOString(),scope:'Karpilo LoadIQ Test Verify service',series:[],cost:{status:'unconfigured',reason:'Verify attempt counts are not an invoice. Shared-account SMS usage and charges remain excluded; service-attributed billing is not connected.'}};
 if(twilioMissingCredentials(env).length)return {...base,status:'unconfigured',reason:'Twilio read credentials are incomplete.'};
 if(!/^VA[0-9a-fA-F]{32}$/.test(env.TWILIO_LOADIQ_VERIFY_SERVICE_SID||''))return {...base,status:'unconfigured',reason:'The verified LoadIQ Verify service mapping is not configured.'};
 const useKey=Boolean(env.TWILIO_API_KEY_SID||env.TWILIO_API_KEY_SECRET);
 const auth='Basic '+Buffer.from((useKey?env.TWILIO_API_KEY_SID:env.TWILIO_ACCOUNT_SID)+':'+(useKey?env.TWILIO_API_KEY_SECRET:env.TWILIO_AUTH_TOKEN)).toString('base64');
 const end=Math.floor(now/3600000)*3600000,days=range==='24h'?1:7;
 const windows=Array.from({length:days},(_,i)=>({start:new Date(end-(days-i)*86400000).toISOString().replace('.000Z','Z'),end:new Date(end-(days-i-1)*86400000).toISOString().replace('.000Z','Z')}));
 const rows=await Promise.all(windows.map(async w=>{const query=new URLSearchParams({VerifyServiceSid:env.TWILIO_LOADIQ_VERIFY_SERVICE_SID,DateCreatedAfter:w.start,DateCreatedBefore:w.end});return readJSON('https://verify.twilio.com/v2/Attempts/Summary?'+query,auth,fetcher,15000)}));
 const failed=rows.find(r=>r.status!=='connected');
 if(failed)return {...base,status:failed.status,reason:'LoadIQ Verify summary could not be read. The restricted key needs Verification Attempts Summary read permission; a failed read is not zero activity.'};
 const fields=['total_attempts','total_converted','total_unconverted'];
 if(rows.some(r=>fields.some(f=>!Number.isSafeInteger(r.data?.[f])||r.data[f]<0)||r.data.total_converted+r.data.total_unconverted!==r.data.total_attempts))return {...base,status:'unavailable',reason:'Twilio returned incomplete or inconsistent counts; no partial history is shown.'};
 return {...base,status:'connected',window:{start:windows[0].start,end:windows.at(-1).end},reason:'Live Verify summaries for Karpilo LoadIQ Test only. Daily windows end at the latest complete UTC hour. Attempts can exceed verification sessions; unconverted attempts are not necessarily failed deliveries.',series:fields.map((f,i)=>({name:['Verification attempts','Converted attempts','Unconverted attempts'][i],unit:'attempts',description:'Provider-reported count in each preceding 24-hour window for the fixed LoadIQ test service. Excludes unrelated services; includes tests.',points:rows.map((r,index)=>({time:windows[index].end,value:r.data[f]}))}))};
}
