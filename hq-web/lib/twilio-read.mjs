import {readJSON, connectionStatus} from './provider-read.mjs';
export async function readTwilio(env = process.env, fetcher = fetch) {
  const checkedAt = new Date().toISOString();
  const keys = ['account', 'usage', 'messages', 'verifyServices'];
  const empty = {checkedAt, account: null, usage: null, messages: null, verifyServices: null, pagination: {}};
  const sid = env.TWILIO_ACCOUNT_SID, token = env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return {...empty, status: 'unconfigured', coverage: Object.fromEntries(keys.map(k => [k, 'pending-key'])), reason: 'Twilio account SID and auth token are missing from the HQ server configuration.'};
  if (!/^AC[0-9a-fA-F]{32}$/.test(sid)) return {...empty, status: 'error', coverage: Object.fromEntries(keys.map(k => [k, 'invalid-configuration'])), reason: 'Account SID configuration is invalid.'};
  const root = 'https://api.twilio.com/2010-04-01/Accounts/' + sid;
  const endpoints = [root + '.json', root + '/Usage/Records/ThisMonth.json?PageSize=100', root + '/Messages.json?PageSize=20', 'https://verify.twilio.com/v2/Services?PageSize=20'];
  const auth = 'Basic ' + Buffer.from(sid + ':' + token).toString('base64');
  const results = await Promise.all(endpoints.map(url => readJSON(url, auth, fetcher)));
  // A successful HTTP response with a malformed body is not an empty inventory.
  const listFields = [null, 'usage_records', 'messages', 'services'];
  results.forEach((r, i) => {if (r.status === 'connected' && (i === 0 ? r.data?.sid !== sid : !Array.isArray(r.data?.[listFields[i]]))) {r.status = 'unavailable'; r.data = null;}});
  const coverage = Object.fromEntries(keys.map((k, i) => [k, results[i].status]));
  const [account, usage, messages, verify] = results.map(r => r.data);
  return {...empty, status: connectionStatus(coverage), coverage,
    account: account ? {id: account.sid, name: account.friendly_name, status: account.status, type: account.type} : null,
    usage: usage ? usage.usage_records.slice(0,100).map(x => ({category: x.category, count: x.count, countUnit: x.count_unit, usage: x.usage, usageUnit: x.usage_unit, price: x.price, currency: x.price_unit, startDate: x.start_date, endDate: x.end_date})) : null,
    messages: messages ? messages.messages.slice(0,20).map(x => ({id: x.sid, status: x.status, direction: x.direction, sentAt: x.date_sent, createdAt: x.date_created, errorCode: x.error_code, price: x.price, currency: x.price_unit})) : null,
    verifyServices: verify ? verify.services.slice(0,20).map(x => ({id: x.sid, name: x.friendly_name, codeLength: x.code_length, createdAt: x.date_created})) : null,
    pagination: {usage: Boolean(usage?.next_page_uri), messages: Boolean(messages?.next_page_uri), verifyServices: Boolean(verify?.meta?.next_page_url)},
    reason: 'Bounded first-page observations. Usage categories can overlap; do not sum them into an invoice. Verify service presence does not prove verification delivery. Message bodies, phone numbers and credentials are excluded.'
  };
}
