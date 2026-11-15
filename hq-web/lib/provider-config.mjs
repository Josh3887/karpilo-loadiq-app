import {SecretsManagerClient, GetSecretValueCommand} from '@aws-sdk/client-secrets-manager';
const keys=['RESEND_API_KEY','TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','EIA_API_KEY','POSTHOG_PERSONAL_API_KEY','POSTHOG_HOST','POSTHOG_PROJECT_ID','SENTRY_AUTH_TOKEN','CLOUDFLARE_API_TOKEN','GITHUB_TOKEN','VERCEL_TOKEN','GOOGLE_MAPS_API_KEY','GOOGLE_CLOUD_PROJECT_ID','GEMINI_API_KEY','TERMLY_API_KEY','STRIPE_SECRET_KEY','STRIPE_TEST_SECRET_KEY','GOOGLE_WORKSPACE_CLIENT_ID','GOOGLE_WORKSPACE_CLIENT_SECRET'];
export function selectProviderConfig(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Provider configuration unavailable');
 return Object.fromEntries(keys.filter(k=>typeof value[k]==='string'&&value[k].trim()).map(k=>[k,value[k]]));
}
export function createConfigReader(load, now=Date.now){
 let cached=null,expires=0,pending=null;
 return async(env=process.env)=>{
  const local=selectProviderConfig(env),arn=env.HQ_PROVIDER_SECRET_ARN;
  if(!arn)return local;
  if(cached?.arn===arn&&expires>now())return {...cached.value,...local};
  if(!pending)pending=load(arn,env.AWS_REGION||'us-east-2').then(raw=>{const value=selectProviderConfig(JSON.parse(raw));cached={arn,value};expires=now()+60000;return value}).finally(()=>{pending=null});
  try{return {...await pending,...local}}catch{throw Error('Provider configuration unavailable')}
 };
}
export const getProviderConfig=createConfigReader(async(SecretId,region)=>{
 const client=new SecretsManagerClient({region,maxAttempts:1});
 const result=await client.send(new GetSecretValueCommand({SecretId}),{abortSignal:AbortSignal.timeout(5000)});
 return result.SecretString;
});
