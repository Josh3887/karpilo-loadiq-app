import test from 'node:test';
import assert from 'node:assert/strict';
import {ACCOUNT_INDEX_NAMES,validateIndex,validateCursor,validateGatewayPayload} from '../lib/aws-account-contract.mjs';
test('all six AWS account indexes are supported',()=>{assert.equal(ACCOUNT_INDEX_NAMES.length,6);for(const name of ACCOUNT_INDEX_NAMES)assert.equal(validateIndex(name),true);assert.equal(validateIndex('admin'),false);});
test('zero customers is a successful empty result, not an error',()=>{assert.equal(validateGatewayPayload({records:[],nextCursor:null}),true);});
test('populated page and pagination are supported',()=>{assert.equal(validateGatewayPayload({records:[{id:'test-only'}],nextCursor:'next-page'}),true);});
test('reject oversized, malformed and unsafe responses',()=>{assert.equal(validateGatewayPayload({records:Array.from({length:101},()=>({}))}),false);assert.equal(validateGatewayPayload({records:'fake'}),false);assert.equal(validateGatewayPayload({records:[null]}),false);assert.equal(validateGatewayPayload({records:[],nextCursor:42}),false);});
test('cursor validation rejects unsafe or oversized cursors',()=>{assert.equal(validateCursor(null),true);assert.equal(validateCursor('abc'),true);assert.equal(validateCursor(''),false);assert.equal(validateCursor('x'.repeat(513)),false);assert.equal(validateCursor('a\nb'),false);});
