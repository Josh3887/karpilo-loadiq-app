import crypto from 'node:crypto';
import pg from 'pg';

// AWS-only Node.js service. Deploy inside the isolated VPC with access to RDS.
// Use a dedicated SELECT-only database role and a dedicated gateway secret.
const INDEXES = Object.freeze({
  subscribers: 'hq_subscribers',
  subscriptions: 'hq_subscriptions',
  vehicles: 'hq_vehicles',
  expenses: 'hq_expenses',
  profit_profiles: 'hq_profit_profiles',
  saved_loads: 'hq_saved_loads',
});
const pool = new pg.Pool({
  connectionString: process.env.HQ_GATEWAY_DATABASE_URL,
  ssl: { rejectUnauthorized: true, ca: process.env.HQ_GATEWAY_RDS_CA_PEM },
  max: 3,
  connectionTimeoutMillis: 4000,
  idleTimeoutMillis: 10000,
});
const MAX_LIMIT = 100;
const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
};
const authorized = (header) => {
  const secret = process.env.HQ_GATEWAY_BEARER_TOKEN;
  if (!secret || secret.length < 32 || !header?.startsWith('Bearer ')) return false;
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const decodeCursor = (value) => {
  if (!value) return 0;
  if (value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('invalid cursor');
  const raw = Buffer.from(value, 'base64url').toString('utf8');
  if (!/^(0|[1-9][0-9]{0,8})$/.test(raw)) throw new Error('invalid cursor');
  const offset = Number(raw);
  if (!Number.isSafeInteger(offset) || offset > 100000000) throw new Error('invalid cursor');
  return offset;
};
export async function handleGatewayRequest(req, res) {
  if (!authorized(req.headers.authorization)) return json(res, 401, { error: 'Unauthorized' });
  const url = new URL(req.url, 'http://gateway.internal');
  if (req.method !== 'GET' || url.pathname !== '/v1/hq/account-index') return json(res, 404, { error: 'Not found' });
  const index = url.searchParams.get('index');
  if (!Object.hasOwn(INDEXES, index) || url.searchParams.getAll('index').length !== 1) return json(res, 400, { error: 'Invalid index' });
  let offset;
  try { offset = decodeCursor(url.searchParams.get('cursor')); }
  catch { return json(res, 400, { error: 'Invalid cursor' }); }
  try {
    // View names come only from the static allowlist. Never interpolate client-supplied identifiers.
    const query = `SELECT * FROM "${INDEXES[index]}" ORDER BY id LIMIT $1 OFFSET $2`;
    const result = await pool.query({ text: query, values: [MAX_LIMIT + 1, offset], statement_timeout: 5000 });
    const hasMore = result.rows.length > MAX_LIMIT;
    return json(res, 200, {
      records: result.rows.slice(0, MAX_LIMIT),
      nextCursor: hasMore ? Buffer.from(String(offset + MAX_LIMIT)).toString('base64url') : null,
    });
  } catch (error) {
    console.error('HQ gateway query failure', { index, code: error.code || 'unknown' });
    return json(res, 503, { error: 'Data source unavailable' });
  }
}
