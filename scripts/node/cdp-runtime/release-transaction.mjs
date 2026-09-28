import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export const TX_STATES = Object.freeze(['PREFLIGHT', 'EXECUTING', 'VERIFYING', 'COMMITTED', 'ROLLED_BACK', 'FAILED']);

export class AuditTrail {
  constructor(path) { this.path = path; this.previousHash = null; }
  async append(event, data = {}) {
    await mkdir(dirname(this.path), { recursive: true });
    const record = { version: 1, timestamp: new Date().toISOString(), event, data, previous_hash: this.previousHash };
    record.hash = hash(record); this.previousHash = record.hash;
    await appendFile(this.path, JSON.stringify(record) + '\n', 'utf8'); return record;
  }
  async verify() {
    let previous = null; let raw = '';
    try { raw = await readFile(this.path, 'utf8'); } catch { return true; }
    for (const line of raw.split('\n').filter(Boolean)) {
      const record = JSON.parse(line); const { hash: expected, ...payload } = record;
      if (record.previous_hash !== previous || expected !== hash(payload)) return false;
      previous = expected;
    }
    return true;
  }
}

export class ReleaseTransaction {
  constructor({ auditPath, adapter, commitCoordinator = null }) {
    if (!auditPath) throw new Error('ReleaseTransaction requires an explicit auditPath');
    if (!adapter || typeof adapter.execute !== 'function' || typeof adapter.verify !== 'function' || typeof adapter.rollback !== 'function') throw new Error('Transaction adapter must implement execute, verify, and rollback');
    this.audit = new AuditTrail(auditPath); this.adapter = adapter; this.commitCoordinator = commitCoordinator;
  }

  async run({ taskId, operation, payload = {}, preflight = {}, requireApproval = false, approved = false, idempotencyKey = null, fencingToken = null } = {}) {
    const txId = hash({ taskId, operation, payload, at: Date.now() }).slice(0, 20);
    await this.audit.append('PREFLIGHT_STARTED', { tx_id: txId, task_id: taskId, operation });
    if (preflight.status !== 'PASS') return this.#rollback(txId, taskId, 'PREFLIGHT_BLOCKED', preflight);
    if (requireApproval && approved !== true) return this.#rollback(txId, taskId, 'HUMAN_APPROVAL_REQUIRED');

    if (this.commitCoordinator && (!idempotencyKey || fencingToken == null)) return this.#rollback(txId, taskId, 'IDEMPOTENCY_CONTEXT_REQUIRED');
    if (this.commitCoordinator) {
      const reservation = await this.commitCoordinator.reserve({ idempotencyKey, txId, fencingToken });
      if (reservation.status === 'COMMITTED') return { status: 'COMMITTED', tx_id: reservation.record.txId, idempotent: true, result: reservation.record.result };
      if (reservation.status === 'CONFLICT') return this.#rollback(txId, taskId, 'IDEMPOTENCY_CONFLICT', reservation.record);
    }

    await this.audit.append('EXECUTION_STARTED', { tx_id: txId, task_id: taskId, operation });
    try {
      const execution = await this.adapter.execute({ txId, taskId, operation, payload });
      await this.audit.append('VERIFY_STARTED', { tx_id: txId });
      const verification = await this.adapter.verify({ txId, taskId, operation, payload, execution });
      if (verification?.status !== 'PASS') return this.#rollback(txId, taskId, 'VERIFICATION_BLOCKED', verification);

      const result = { execution, verification };
      if (this.commitCoordinator) {
        const commit = await this.commitCoordinator.commit({ idempotencyKey, txId, fencingToken, result });
        if (commit.status !== 'COMMITTED') return this.#rollback(txId, taskId, 'COMMIT_COORDINATION_FAILED', commit);
      }
      await this.audit.append('COMMIT', { tx_id: txId, verification, idempotency_key: idempotencyKey });
      return { status: 'COMMITTED', tx_id: txId, ...result };
    } catch (error) {
      return this.#rollback(txId, taskId, 'EXECUTION_ERROR', { message: error.message });
    }
  }

  async #rollback(txId, taskId, reason, detail = {}) {
    try {
      const rollback = await this.adapter.rollback({ txId, taskId, reason });
      if (this.commitCoordinator) await this.commitCoordinator.abort({ idempotencyKey: detail.idempotencyKey ?? null, txId, fencingToken: detail.fencingToken ?? null });
      await this.audit.append('ROLLBACK', { tx_id: txId, reason, detail, rollback });
      return { status: 'ROLLED_BACK', tx_id: txId, reason, rollback };
    } catch (error) {
      await this.audit.append('ROLLBACK_FAILED', { tx_id: txId, reason, error: error.message });
      return { status: 'FAILED', tx_id: txId, reason, rollback_error: error.message };
    }
  }
}
