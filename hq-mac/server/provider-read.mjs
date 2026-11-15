// Server-only bounded provider reads; never return provider error bodies.
export async function readJSON(url, authorization, fetcher = fetch) {
  try {
    const response = await fetcher(url, {headers: {Authorization: authorization, Accept: 'application/json'}, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000)});
    if (!response.ok) return {status: response.status === 429 ? 'rate-limited' : response.status === 401 || response.status === 403 ? 'access-denied' : 'unavailable', httpStatus: response.status, data: null};
    return {status: 'connected', data: await response.json()};
  } catch { return {status: 'unavailable', data: null}; }
}
export function connectionStatus(coverage) {
  const values = Object.values(coverage);
  return values.every(v => v === 'connected') ? 'connected' : values.some(v => v === 'connected') ? 'partial' : 'error';
}
export const responseHeaders = {'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'};
