// Run: node --test tests/facility-mileage.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function loader(stubs = {}) {
  const cache = new Map();
  return function load(name) {
    if (Object.hasOwn(stubs, name)) return stubs[name];
    const filename = path.resolve(root, name.replace(/^@\//, 'src/'));
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const file = fs.existsSync(filename) && fs.statSync(filename).isFile() ? filename : filename + '.ts';
    const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const localRequire = Module.createRequire(file);
    new Function('require', 'module', 'exports', js)((request) => {
      if (Object.hasOwn(stubs, request)) return stubs[request];
      if (request.startsWith('@/')) return load(request);
      if (request.startsWith('.')) return load(path.resolve(path.dirname(file), request));
      return localRequire(request);
    }, module, module.exports);
    return module.exports;
  };
}
const load = loader();
const { facilitiesFromSavedLoads, searchFacilities } = load('@/services/facilities/directory');
const { buildAddressRouteRequest, routeRequestKey, estimateMatchesRequest } = load('@/services/route-intelligence/route-input');
const input = { pickupFacilityName: 'Example Mill', pickupAddress: '100 Example Rd', pickupCity: 'Denver', pickupState: 'CO', pickupZip: '80201', deliveryAddress: '200 Sample St', deliveryCity: 'Pueblo', deliveryState: 'CO', deliveryZip: '81001' };

test('saved input becomes reusable addresses without leaking private notes or Google response data', () => {
  const facilities = facilitiesFromSavedLoads([{ id: 'one', input_snapshot: { ...input, notes: 'private', routeEstimate: { origin: { formattedAddress: 'provider content' } } } }]);
  assert.equal(facilities.length, 2);
  assert.equal(facilities[0].name, 'Example Mill');
  assert.equal(facilities[0].source, 'driver_saved');
  assert.ok(!JSON.stringify(facilities).includes('private'));
  assert.ok(!JSON.stringify(facilities).includes('provider content'));
  assert.equal(searchFacilities(facilities, 'example denver 80201').length, 1);
});
test('deduplication keeps different branches and unit numbers; malformed snapshots are ignored', () => {
  const facilities = facilitiesFromSavedLoads([{ id: 'a', input_snapshot: input }, { id: 'b', input_snapshot: input }, { id: 'c', input_snapshot: { ...input, pickupAddress: '100 Example Rd Unit 2' } }, { id: 'bad', input_snapshot: { pickupAddress: 123 } }]);
  assert.equal(searchFacilities(facilities, 'example').length, 2);
  assert.equal(facilitiesFromSavedLoads([{ id: 'bad', input_snapshot: null }]).length, 0);
});
test('full addresses and ordered stops feed mileage; blank stops are retained for rejection', () => {
  const request = buildAddressRouteRequest({ ...input, routeStops: [{ stopType: 'delivery', address: 'Stop two' }, { stopType: 'pickup', address: '' }] });
  assert.equal(request.pickupAddress, '100 Example Rd, Denver, CO, 80201');
  assert.equal(request.stops.length, 2);
  assert.equal(request.stops[1].address, '');
  assert.equal(request.stops[0].kind, 'delivery');
  assert.equal(request.stops[1].sequence, 2);
});
test('changed address, deadhead, or stop order invalidates an estimate; financial edits do not', () => {
  const request = buildAddressRouteRequest(input);
  const estimate = { requestKey: routeRequestKey(request) };
  assert.ok(estimateMatchesRequest(estimate, buildAddressRouteRequest({ ...input, loadedMiles: 500 })));
  assert.ok(!estimateMatchesRequest(estimate, buildAddressRouteRequest({ ...input, pickupAddress: '300 Changed Rd' })));
  assert.ok(!estimateMatchesRequest(estimate, buildAddressRouteRequest({ ...input, deadheadStartCity: 'Another city' })));
  const stops = [{ address: 'A', stopType: 'pickup' }, { address: 'B', stopType: 'delivery' }];
  assert.notEqual(routeRequestKey(buildAddressRouteRequest({ ...input, routeStops: stops })), routeRequestKey(buildAddressRouteRequest({ ...input, routeStops: [...stops].reverse() })));
});
test('old saved estimates are accepted only for matching recorded addresses', () => {
  const request = buildAddressRouteRequest(input);
  const estimate = { origin: { input: request.pickupAddress }, destination: { input: request.deliveryAddress } };
  assert.ok(estimateMatchesRequest(estimate, request));
  assert.ok(!estimateMatchesRequest(estimate, { ...request, deliveryAddress: 'Changed' }));
});

test('facility API authenticates, scopes database reads to owner and uses private no-store', async () => {
  const calls = [];
  let user = { id: 'driver-one' };
  const query = {
    select: (value) => { calls.push(['select', value]); return query; },
    eq: (...args) => { calls.push(['eq', ...args]); return query; },
    order: () => query,
    limit: async (value) => { calls.push(['limit', value]); return { data: [{ id: 'one', input_snapshot: input }], error: null }; },
  };
  const scoped = loader({ '@/lib/supabase-server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) }, from: () => query }) } });
  const { POST } = scoped('@/app/api/facilities/route');
  const request = () => new Request('https://example.test/api/facilities', { method: 'POST', body: JSON.stringify({ query: 'Example' }) });
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).facilities.length, 1);
  assert.ok(calls.some((call) => call.join('|') === 'eq|user_id|driver-one'));
  assert.match(response.headers.get('Cache-Control'), /private.*no-store/);
  user = null;
  calls.length = 0;
  assert.equal((await POST(request())).status, 401);
  assert.equal(calls.length, 0);
});

test('Google miles are standard DRIVE estimates; missing legs never produce partial totals', async () => {
  const originalFetch = global.fetch;
  const oldKey = process.env.GOOGLE_MAPS_API_KEY;
  process.env.GOOGLE_MAPS_API_KEY = 'test-only';
  let failRoutes = false;
  const routes = [];
  global.fetch = async (url, options) => {
    if (String(url).includes('addressvalidation')) return Response.json({ result: { verdict: { addressComplete: true, validationGranularity: 'PREMISE', geocodeGranularity: 'PREMISE' }, geocode: { location: { latitude: 39, longitude: -104 } }, address: { formattedAddress: 'Test address' } } });
    routes.push(JSON.parse(options.body));
    return Response.json(failRoutes ? { routes: [] } : { routes: [{ distanceMeters: 16093.44, duration: '600s' }] });
  };
  try {
    const { estimateGoogleRoutePlan } = load('@/services/route-intelligence/google-provider');
    const result = await estimateGoogleRoutePlan({ pickupAddress: 'Test pickup', deliveryAddress: 'Test delivery', deadheadOrigin: 'Test origin', stops: [{ address: 'Test stop', kind: 'pickup', sequence: 1 }] });
    assert.equal(result.estimate.loadedEstimate.estimatedLoadedMiles, 20);
    assert.equal(result.estimate.deadheadEstimate.estimatedDeadheadMiles, 10);
    assert.equal(result.estimate.totalEstimate.estimatedMiles, 30);
    assert.equal(result.estimate.truckSpecific, false);
    assert.match(result.estimate.disclaimer, /not guaranteed/);
    assert.ok(routes.every((request) => request.travelMode === 'DRIVE'));
    failRoutes = true;
    const failed = await estimateGoogleRoutePlan({ pickupAddress: 'Test pickup', deliveryAddress: 'Test delivery' });
    assert.equal(failed.estimate.totalEstimate.estimatedMiles, null);
    assert.notEqual(failed.status, 'available');
  } finally { global.fetch = originalFetch; if (oldKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY; else process.env.GOOGLE_MAPS_API_KEY = oldKey; }
});

test('estimate endpoint rejects oversized routes and normalizes timeout failures', async () => {
  let calls = 0;
  const scoped = loader({
    '@/lib/supabase-server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'driver-one' } } }) } }) },
    '@/services/route-intelligence/route-intelligence-service': { estimateRoute: async () => { calls++; throw new Error('provider secret must never appear'); } },
  });
  const { POST } = scoped('@/app/api/route-intelligence/estimate/route');
  const request = (body) => new Request('https://example.test/api/route-intelligence/estimate', { method: 'POST', body: JSON.stringify(body) });
  const base = { pickupAddress: '100 Example Rd', deliveryAddress: '200 Example Rd' };
  assert.equal((await POST(request({ ...base, stops: Array.from({ length: 11 }, () => ({ address: 'Stop', kind: 'pickup' })) }))).status, 400);
  assert.equal((await POST(request({ ...base, pickupAddress: 'x'.repeat(501) }))).status, 400);
  assert.equal((await POST(request({ ...base, stops: [{ address: '', kind: 'pickup' }] }))).status, 400);
  assert.equal(calls, 0);
  const response = await POST(request(base));
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal(payload.estimate, null);
  assert.ok(!JSON.stringify(payload).includes('secret'));
  assert.equal(calls, 1);
});
