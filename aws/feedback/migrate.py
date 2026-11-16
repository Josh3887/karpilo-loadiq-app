import boto3, json, os, ssl, pathlib, secrets
from urllib.parse import quote, urlparse, unquote
import pg8000.dbapi

def handler(event, context):
    if event != {'operation': 'apply-019-isolated-feedback'}:
        raise ValueError('Explicit isolated migration operation required')
    sm = boto3.client('secretsmanager', region_name='us-east-2')
    master = json.loads(sm.get_secret_value(SecretId=os.environ['MASTER_SECRET_ARN'])['SecretString'])
    target = json.loads(sm.get_secret_value(SecretId=os.environ['TARGET_SECRET_ARN'])['SecretString'])
    password = target.get('password') or unquote(urlparse(target['connection']).password)
    host = 'karpilo-isolated-test.cjyiueiayw8w.us-east-2.rds.amazonaws.com'
    ca = pathlib.Path('/opt/python/us-east-2-bundle.pem').read_text()
    db = pg8000.dbapi.connect(host=host, port=5432, database='karpilo_isolated_test', user=master['username'], password=master['password'], ssl_context=ssl.create_default_context(cadata=ca), timeout=15)
    try:
        cur = db.cursor()
        cur.execute('SELECT pg_advisory_xact_lock(831072619)')
        cur.execute("SELECT to_regclass('karpilo.feedback_requests')")
        if cur.fetchone()[0] is None:
            cur.execute(pathlib.Path('/var/task/015_feedback_requests.sql').read_text().replace('BEGIN;', '', 1).rsplit('COMMIT;', 1)[0])
        cur.execute('CREATE TABLE IF NOT EXISTS public.karpilo_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
        cur.execute("SELECT version FROM public.karpilo_migrations WHERE version='019_feedback_conversations'")
        applied = cur.fetchone() is not None
        if not applied:
            sql = pathlib.Path('/var/task/019_feedback_conversations.sql').read_text()
            cur.execute(sql.replace('BEGIN;', '', 1).rsplit('COMMIT;', 1)[0])
            cur.execute("INSERT INTO public.karpilo_migrations(version) VALUES('019_feedback_conversations')")
        cur.execute("SELECT 1 FROM pg_roles WHERE rolname='karpilo_feedback_gateway'")
        if cur.fetchone() is None:
            cur.execute('CREATE ROLE karpilo_feedback_gateway LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS')
        cur.execute("SELECT format('ALTER ROLE %%I PASSWORD %%L', %s, %s)", ('karpilo_feedback_gateway', password))
        cur.execute(cur.fetchone()[0])
        cur.execute('GRANT CONNECT ON DATABASE karpilo_isolated_test TO karpilo_feedback_gateway')
        cur.execute('GRANT karpilo_feedback_moderator,karpilo_reviews_public TO karpilo_feedback_gateway')
        connection = 'postgresql://karpilo_feedback_gateway:'+quote(password,safe='')+'@'+host+':5432/karpilo_isolated_test'
        sm.put_secret_value(SecretId=os.environ['TARGET_SECRET_ARN'], SecretString=json.dumps({'connection':connection,'ca':ca}))
        db.commit()
        return {'applied':True,'alreadyApplied':applied,'schema':'019_feedback_conversations','credentials':'stored-server-only'}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
