import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export function hashText(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

export function createEvidence({ claim, sourceUrl, selector = null, snapshot = null, screenshot = null, observedAt = new Date().toISOString(), metadata = {} }) {
  return { claim, source_url: sourceUrl, observed_at: observedAt, selector, snapshot, screenshot, content_hash: hashText(JSON.stringify({ claim, sourceUrl, selector, snapshot })), metadata };
}

export async function writeEvidence(dir, evidence) {
  await mkdir(dir, { recursive: true });
  const path = join(dir, 'evidence.json');
  await writeFile(path, JSON.stringify({ version: 1, evidence }, null, 2) + '\n');
  return path;
}
