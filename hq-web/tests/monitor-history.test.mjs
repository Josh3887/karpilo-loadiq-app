import test from 'node:test';import assert from 'node:assert/strict';import {normalizeHistory,readHistory} from '../lib/monitor-history.mjs';
const item=(checkedAt)=>({payload:{S:JSON.stringify({checkedAt,observations:[]})}});
test('missing snapshots never indicate healthy collection',()=>assert.equal(normalizeHistory({Items:[]}).status,'awaiting-first-run'));
test('stale snapshots preserve timestamps and flag collection gap',()=>{const r=normalizeHistory({Items:[item('2026-11-16T00:00:00Z')]},Date.parse('2026-11-16T01:00:00Z'));assert.equal(r.status,'stale');assert.equal(r.latest.checkedAt,'2026-11-16T00:00:00Z')});
test('ordered history and pagination disclosure',()=>{const r=normalizeHistory({Items:[item('2026-11-16T00:05:00Z'),item('2026-11-16T00:00:00Z')],LastEvaluatedKey:{}},Date.parse('2026-11-16T00:06:00Z'));assert.equal(r.status,'connected');assert.equal(r.snapshots[0].checkedAt,'2026-11-16T00:00:00Z');assert.equal(r.partial,true)});
test('no credential no call',async()=>assert.equal((await readHistory({},()=>{throw Error('must not call')})).status,'unconfigured'));
