import test from 'node:test';
import assert from 'node:assert/strict';
import {costRequest,normalizeCosts} from '../lib/aws-costs.mjs';
const now=new Date('2026-11-16T05:00:00Z'),req=costRequest(now);
const day=(amount,unit='USD')=>({TimePeriod:{Start:'2026-11-15'},Estimated:true,Groups:[{Keys:['Amazon RDS'],Metrics:{UnblendedCost:{Amount:amount,Unit:unit}}}]});
test('fixed allocation and exclusive complete-day period',()=>{assert.deepEqual(req.TimePeriod,{Start:'2026-11-01',End:'2026-11-16'});assert.equal(req.Filter.Or.length,4);assert.equal(req.Granularity,'DAILY')});
test('no matching allocations is not a zero bill',()=>{const r=normalizeCosts({ResultsByTime:[{TimePeriod:{Start:'2026-11-15'},Groups:[]}]},req,now);assert.equal(r.status,'connected-empty');assert.equal(r.total,null);assert.deepEqual(r.series,[])});
test('tagged totals include only returned service groups',()=>{const r=normalizeCosts({ResultsByTime:[day('1.25')]},req,now);assert.equal(r.total,1.25);assert.equal(r.coverage,'partial');assert.equal(r.estimated,true);assert.equal(r.services[0].name,'Amazon RDS')});
test('pagination and invalid money suppress totals',()=>{assert.equal(normalizeCosts({NextPageToken:'next',ResultsByTime:[day('4')]},req,now).total,null);for(const d of [day('oops'),day('3','EUR'),day('')])assert.equal(normalizeCosts({ResultsByTime:[d]},req,now).status,'unavailable')});
