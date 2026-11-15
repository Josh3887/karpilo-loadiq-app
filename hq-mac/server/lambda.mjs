import {CognitoJwtVerifier} from 'aws-jwt-verify';
import {SecretsManagerClient,GetSecretValueCommand} from '@aws-sdk/client-secrets-manager';
import {identity} from './access.mjs';
import {createLambdaHandler,parseProviderConfig} from './lambda-handler.mjs';
const verifier=CognitoJwtVerifier.create({userPoolId:identity.pool,clientId:identity.client,tokenUse:'access'});
const allowedSubjects=new Set((process.env.HQ_OPERATOR_SUBJECTS??'').split(',').filter(Boolean));
if(!allowedSubjects.size)throw Error('No HQ operator enrolled');
const secrets=new SecretsManagerClient({});
export const handler=createLambdaHandler({
 verify:(token)=>verifier.verify(token),allowedSubjects,env:process.env,
 getConfig:async()=>{
  const response=await secrets.send(new GetSecretValueCommand({SecretId:process.env.HQ_PROVIDER_SECRET_ARN}));
  if(!response.SecretString)throw Error('Provider secret is unavailable');
  return parseProviderConfig(response.SecretString);
 }
});
