import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { hashText, createEvidence } from './evidence.mjs';

export class EvidenceLedger {
  constructor(dir) { this.dir = dir; this.records = []; }
  add(record) { const evidence = createEvidence(record); evidence.id = hashText(JSON.stringify(evidence)).slice(0, 16); this.records.push(evidence); return evidence; }
  async save() { await mkdir(this.dir, { recursive: true }); const path = join(this.dir, 'ledger.json'); await writeFile(path, JSON.stringify({ version: 1, records: this.records }, null, 2) + '\n'); return path; }
  static async load(dir) { const ledger = new EvidenceLedger(dir); try { ledger.records = JSON.parse(await readFile(join(dir, 'ledger.json'), 'utf8')).records || []; } catch {} return ledger; }
}
