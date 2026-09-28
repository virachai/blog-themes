import { mkdir, readFile, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export const COMMIT_STATES = Object.freeze(['RESERVED', 'COMMITTED', 'ABORTED']);

export class IdempotencyLedger {
  constructor(path) {
    if (!path) throw new Error('Idempotency ledger path is required');
    this.path = path;
    this.sequence = 0;
    this.previousHash = 'GENESIS';
    this.records = new Map();
  }

  async append(type, record) {
    await mkdir(dirname(this.path), { recursive: true });
    const event = { sequence: ++this.sequence, type, timestamp: new Date().toISOString(), record: JSON.parse(JSON.stringify(record)), previous_hash: this.previousHash };
    event.hash = digest(event);
    await appendFile(this.path, JSON.stringify(event) + '\n', 'utf8');
    this.previousHash = event.hash;
    this.records.set(record.idempotencyKey, { ...record });
    return event;
  }

  async load() {
    this.sequence = 0; this.previousHash = 'GENESIS'; this.records.clear();
    let raw;
    try { raw = await readFile(this.path, 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') return []; throw error; }
    for (const line of raw.split('\n').filter(Boolean)) {
      const event = JSON.parse(line);
      const body = { sequence: event.sequence, type: event.type, timestamp: event.timestamp, record: event.record, previous_hash: event.previous_hash };
      if (event.sequence !== this.sequence + 1 || event.previous_hash !== this.previousHash || event.hash !== digest(body)) throw new Error('Idempotency ledger integrity failure');
      this.sequence = event.sequence; this.previousHash = event.hash;
      this.records.set(event.record.idempotencyKey, event.record);
    }
    return [...this.records.values()].map(record => ({ ...record }));
  }

  async reserve({ idempotencyKey, txId, fencingToken }) {
    await this.load();
    const existing = this.records.get(idempotencyKey);
    if (existing?.state === 'COMMITTED') return { status: 'COMMITTED', record: existing };
    if (existing?.state === 'RESERVED' && existing.txId !== txId) return { status: 'CONFLICT', record: existing };
    const record = { idempotencyKey, txId, fencingToken, state: 'RESERVED', result: null };
    await this.append('RESERVE', record);
    return { status: 'RESERVED', record };
  }

  async commit({ idempotencyKey, txId, fencingToken, result }) {
    await this.load();
    const existing = this.records.get(idempotencyKey);
    if (existing?.state === 'COMMITTED') {
      if (existing.txId !== txId) throw new Error('Idempotency key already committed by another transaction');
      return { status: 'COMMITTED', record: existing, duplicate: true };
    }
    if (!existing || existing.txId !== txId || existing.fencingToken !== fencingToken || existing.state !== 'RESERVED') {
      throw new Error('Commit ownership or fencing validation failed');
    }
    const record = { ...existing, state: 'COMMITTED', result: JSON.parse(JSON.stringify(result)) };
    await this.append('COMMIT', record);
    return { status: 'COMMITTED', record, duplicate: false };
  }

  async abort({ idempotencyKey, txId, fencingToken }) {
    await this.load();
    const existing = this.records.get(idempotencyKey);
    if (!existing || existing.txId !== txId || existing.fencingToken !== fencingToken) return { status: 'NOOP' };
    if (existing.state === 'COMMITTED') return { status: 'COMMITTED', record: existing };
    const record = { ...existing, state: 'ABORTED' };
    await this.append('ABORT', record);
    return { status: 'ABORTED', record };
  }

  async verify() {
    await this.load();
    return { valid: true, sequence: this.sequence, keys: this.records.size, hash: this.previousHash };
  }
}

export class DistributedCommitCoordinator {
  constructor({ ledger }) {
    if (!ledger) throw new Error('DistributedCommitCoordinator requires a ledger');
    this.ledger = ledger;
  }

  async reserve(input) { return this.ledger.reserve(input); }
  async commit(input) { return this.ledger.commit(input); }
  async abort(input) { return this.ledger.abort(input); }
  async verify() { return this.ledger.verify(); }
}
