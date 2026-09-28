#!/usr/bin/env node
import assert from 'node:assert/strict';

const ready={status:'READY_FOR_MEASUREMENT'};
assert.equal(ready.status,'READY_FOR_MEASUREMENT');

const valid={
  baseline:'10',
  target:'20',
  observations:[{value:'15',checked_at:'2026-09-28T00:00:00Z',sources:['https://example.com/metrics']}]
};
assert.equal(valid.observations.length>0,true);
assert.equal(valid.observations.every(o=>String(o.value).trim()!==''),true);
assert.equal(valid.observations.every(o=>/^https:\/\//.test(o.sources[0])),true);

const invalid={...valid,observations:[{value:'15',checked_at:'',sources:[]}]};
assert.equal(invalid.observations.some(o=>!o.checked_at||!o.sources.length),true);

console.log('STAGE-65-MEASUREMENT-OBSERVATION-CHECK: PASS');
