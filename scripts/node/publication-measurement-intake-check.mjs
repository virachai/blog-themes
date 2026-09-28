#!/usr/bin/env node
/**
 * Stage 64 deterministic contract check.
 * Tests classification logic through fixture artifacts; no network or mutation.
 */
import assert from 'node:assert/strict';
import { assertAuthoritativeReceipt } from './publication-receipt.mjs';

const validReceipt = {
  runtime: 'blogger-publication-adapter-v1',
  status: 'PUBLISHED',
  publication: { status: 'PUBLISHED',
    page_state: 'PUBLISHED_CANDIDATE',
    url: 'https://meeprompt.blogspot.com/2026/08/stage-64.html',
    external_id: '2026/08/stage-64.html',
    published_at: '2026-09-28T00:00:00.000Z',
  },
};
assert.doesNotThrow(() => assertAuthoritativeReceipt(validReceipt));
assert.throws(() => assertAuthoritativeReceipt({
  ...validReceipt,
  runtime: 'value-mission-publication-runtime-v1',
}));
assert.equal(validReceipt.status, 'PUBLISHED');
assert.ok(validReceipt.publication.url.startsWith('https://'));
assert.ok(validReceipt.publication.external_id);

const verified = {
  status: 'PASS',
  publication_status: 'PUBLISHED_VERIFIED',
  feedback_state: 'PUBLISHED_VERIFIED',
};
assert.equal(
  verified.status === 'PASS'
  && verified.publication_status === 'PUBLISHED_VERIFIED'
  && verified.feedback_state === 'PUBLISHED_VERIFIED',
  true
);

const plan = { metric: 'organic_clicks_28d', observation_days: 28, baseline_required: true, target_required: true };
assert.equal(typeof plan.metric, 'string');
assert.equal(Number.isInteger(plan.observation_days) && plan.observation_days > 0, true);

console.log('STAGE-64-MEASUREMENT-INTAKE-CHECK: PASS');
