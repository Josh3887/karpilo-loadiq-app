"""Read-only provider observations. No messages, customer records or PostHog capture."""
import concurrent.futures, datetime, json, os, time, urllib.request, urllib.error, urllib.parse
import boto3
from botocore.config import Config
REGION='us-east-2'
CONFIG=Config(connect_timeout=3,read_timeout=8,retries={'max_attempts':1})
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): return None
OPENER=urllib.request.build_opener(NoRedirect())
def request(url,token=None):
    headers={'Accept':'application/json','User-Agent':'Karpilo-LoadIQ-HQ-Monitor/1.0'}
    if token: headers['Authorization']=token
    started=time.monotonic()
    try:
        with OPENER.open(urllib.request.Request(url,headers=headers),timeout=8) as r:
            status=r.status
            body=r.read(1048577)
        data=json.loads(body) if len(body)<=1048576 else None
        return status,data,round((time.monotonic()-started)*1000)
    except urllib.error.HTTPError as e: return e.code,None,round((time.monotonic()-started)*1000)
    except Exception: return None,None,round((time.monotonic()-started)*1000)
def probe(host,surface):
    started=time.monotonic()
    try:
        with OPENER.open(urllib.request.Request('https://'+host,method='HEAD',headers={'User-Agent':'Karpilo-LoadIQ-HQ-Monitor/1.0'}),timeout=8) as r: status=r.status
    except urllib.error.HTTPError as e: status=e.code
    except Exception: status=None
    # A protected HQ 401 is expected; redirects establish reachability only.
    good=status is not None and (200<=status<400 or surface=='hq' and status==401)
    return {'id':surface,'provider':'Web','label':host,'status':'connected' if good else 'unavailable','httpStatus':status,'latencyMs':round((time.monotonic()-started)*1000),'detail':'HTTPS HEAD probe; not a customer workflow or traffic measurement.'}
def provider(name,env):
    if name=='Redis':
        u=urllib.parse.urlparse(env.get('UPSTASH_REDIS_REST_URL',''))
        if u.scheme!='https' or not (u.hostname or '').endswith('.upstash.io') or u.username or u.password or u.port or u.path not in ('','/') or u.query or u.fragment: return {'id':'redis','provider':name,'status':'unconfigured','detail':'Valid Redis REST endpoint required.'}
        key=env.get('UPSTASH_REDIS_REST_TOKEN');url=env['UPSTASH_REDIS_REST_URL'].rstrip('/')+'/ping'
    elif name=='Resend': key=env.get('RESEND_API_KEY');url='https://api.resend.com/domains?limit=100'
    elif name=='Cloudflare': key=env.get('CLOUDFLARE_API_TOKEN');url='https://api.cloudflare.com/client/v4/zones/354a61884ea0777e1c8a1a8f01b8aa8a/dns_records?per_page=100'
    elif name=='Sentry': key=env.get('SENTRY_AUTH_TOKEN');url='https://sentry.io/api/0/projects/karpilo-endeavor-technologies/karpilo-loadiq-isolated/issues/?query=is%3Aunresolved&statsPeriod=14d&limit=20'
    if not key: return {'id':name.lower(),'provider':name,'status':'unconfigured','detail':'Provider credential missing.'}
    status,data,latency=request(url,'Bearer '+key)
    result={'id':name.lower(),'provider':name,'httpStatus':status,'latencyMs':latency,'status':'connected' if status==200 else 'access-denied' if status in (401,403) else 'unavailable'}
    if status!=200: return result
    if name=='Redis':
        if not isinstance(data,dict) or data.get('result')!='PONG':result['status']='unavailable'
        result['detail']='Read-only PING; no customer keys inspected.'
    elif name=='Resend':
        if not isinstance(data,dict) or not isinstance(data.get('data'),list):result['status']='unavailable'
        else:
            domains=[{'name':d['name'],'status':d.get('status','unknown')} for d in data['data'] if d.get('name') in ('karpilo-liq.com','karpiloliq.com','karpiloloadiq.com')]
            result['domains']=domains;result['status']='attention' if any(d['status']=='failed' for d in domains) else 'connected'
            result['detail']='LoadIQ sender domains only; domain verification is separate from delivery.'
    elif name=='Cloudflare':
        if not isinstance(data,dict) or data.get('success') is not True or not isinstance(data.get('result'),list):result['status']='unavailable'
        else:
            result['recordCount']=len(data['result']);result['partial']=data.get('result_info',{}).get('total_pages',1)>1
            result['detail']='karpilo-liq.com DNS inventory; values excluded. Not traffic analytics.'
    elif name=='Sentry':
        if not isinstance(data,list):result['status']='unavailable'
        else:
            result['issueCount']=len(data);result['status']='attention' if data else 'connected'
            result['detail']='Up to 20 unresolved issues, last 14 days; not new incidents. Payloads excluded.'
    return result
def handler(event,context):
    now=datetime.datetime.now(datetime.timezone.utc);checked=now.isoformat().replace('+00:00','Z')
    env={};secret_status='connected'
    try:env=json.loads(boto3.client('secretsmanager',region_name=REGION,config=CONFIG).get_secret_value(SecretId=os.environ['SECRET_ARN'])['SecretString'])
    except Exception:secret_status='unavailable'
    with concurrent.futures.ThreadPoolExecutor(max_workers=7) as pool:
        jobs=[pool.submit(probe,h,s) for h,s in [('karpilo-liq.com','website'),('app.karpilo-liq.com','app'),('hq.karpilo-liq.com','hq')]]
        jobs += [pool.submit(provider,n,env) for n in ['Redis','Resend','Cloudflare','Sentry']]
        observations=[j.result() for j in jobs]
    snapshot={'checkedAt':checked,'intervalSeconds':300,'secretStatus':secret_status,'observations':observations}
    # Same scheduled event retries cannot duplicate a time bucket.
    bucket=str(int(now.timestamp())//300*300).zfill(12)
    boto3.client('dynamodb',region_name=REGION,config=CONFIG).put_item(TableName=os.environ['TABLE'],Item={'pk':{'S':'loadiq'},'sk':{'S':bucket},'expiresAt':{'N':str(int(now.timestamp())+30*86400)},'payload':{'S':json.dumps(snapshot,separators=(',',':'))}})
    return {'stored':True,'checkedAt':checked,'observations':len(observations)}
