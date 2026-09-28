#!/usr/bin/env node
/**
 * Stage 63 deterministic regression gate. No network, Chrome, SMTP, or writes.
 */
import assert from 'node:assert/strict';
import { buildPublicationReceipt } from './publication-receipt.mjs';
import { classifyBloggerPage } from './blogger-page-state.mjs';

const PUBLIC_URL = 'https://meeprompt.blogspot.com/2026/08/blog-post.html';
const EDITOR_URL = 'https://www.blogger.com/blog/post/edit/6973756749045108777/6268864657932604137';

assert.equal(classifyBloggerPage(PUBLIC_URL).state, 'PUBLISHED_CANDIDATE');
assert.equal(classifyBloggerPage(PUBLIC_URL).post_url, PUBLIC_URL);
assert.equal(classifyBloggerPage(EDITOR_URL).state, 'EDITING');
assert.equal(classifyBloggerPage(EDITOR_URL).post_url, null);

const receipt = buildPublicationReceipt({
  runId: 'TEST-63',
  verification: { status: 'PASS', page_state: 'PUBLISHED_CANDIDATE', url: PUBLIC_URL, external_id: '2026/08/blog-post.html', published_at: null },
  evidenceId: 'evt-test',
  transactionId: 'tx-test',
  verifiedAt: '2026-09-28T00:00:00.000Z',
});
assert.equal(receipt.runtime, 'blogger-publication-adapter-v1');
assert.equal(receipt.status, 'PUBLISHED');
assert.equal(receipt.publication.url, PUBLIC_URL);
assert.equal(receipt.publication.external_id, '2026/08/blog-post.html');

assert.throws(() => buildPublicationReceipt({
  runId: 'TEST-63',
  verification: { status: 'PASS', page_state: 'EDITING', url: EDITOR_URL, external_id: '' },
}));

console.log('STAGE-63-VERIFICATION-CHECK: PASS');
