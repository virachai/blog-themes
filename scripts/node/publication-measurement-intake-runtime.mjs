#!/usr/bin/env node
/**
 * Stage 64 — Publication Measurement & Learning Intake Runtime.
 * Bridge only: verified publication -> measurement eligibility.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertAuthoritativeReceipt } from './publication-receipt.mjs';

const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');
const json = file => existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
const save = (dir, name, value) => writeFileSync(join(dir, name), JSON.stringify(value, null, 2) + '\n');

function load(runId) {
  const dir = join(RUNS, runId);
  const manifest = json(join(dir, 'manifest.json'));
  if (!manifest) throw new Error('run not found: ' + runId);
  return {
    dir,
    manifest,
    receipt: json(join(dir, 'publication-receipt.json')),
    verification: json(join(dir, 'publication-verification.json')),
    feedback: json(join(dir, 'publication-feedback.json')),
    plan: json(join(dir, 'measurement-plan.json')),
  };
}

function inspect(run, runId) {
  const checks = [];
  const check = (id, pass, message) => checks.push({ id, severity: pass ? 'PASS' : 'BLOCK', message });

  let receiptOk = false;
  try { assertAuthoritativeReceipt(run.receipt); receiptOk = true; }
  catch (error) { check('V64-001', false, error.message); }
  if (receiptOk) check('V64-001', true, 'authoritative Stage 61 publication receipt is present');

  const verified = run.verification?.status === 'PASS'
    && run.verification?.publication_status === 'PUBLISHED_VERIFIED'
    && run.verification?.feedback_state === 'PUBLISHED_VERIFIED'
    && run.verification?.run_id === runId;
  check('V64-002', verified, verified
    ? 'Stage 63 confirms PUBLISHED_VERIFIED'
    : 'Stage 63 verification is not PUBLISHED_VERIFIED for this run');

  const url = String(run.receipt?.publication?.url ?? '').trim();
  const externalId = String(run.receipt?.publication?.external_id ?? '').trim();
  check('V64-003', !!url && !!externalId, 'receipt contains public URL and external_id');

  const metric = String(run.plan?.metric ?? '').trim();
  const days = Number(run.plan?.observation_days);
  check('V64-004', !!metric && Number.isInteger(days) && days > 0, 'measurement plan declares metric and positive observation window');

  const blockers = checks.filter(x => x.severity === 'BLOCK');
  let status = blockers.length ? 'BLOCKED' : 'READY_FOR_MEASUREMENT';
  let state = status;

  if (!receiptOk) state = 'AWAITING_PUBLICATION';
  else if (!verified) state = 'AWAITING_VERIFICATION';

  return {
    runtime: 'publication-measurement-intake-runtime-v1',
    stage: 64,
    run_id: runId,
    mission_id: run.manifest.mission_id,
    status,
    measurement_state: state,
    checks,
    blockers: blockers.map(x => x.id),
    publication: receiptOk ? {
      url,
      external_id: externalId,
      published_at: run.receipt.publication?.published_at ?? null,
    } : null,
    measurement: run.plan ? {
      metric: metric || null,
      observation_days: Number.isInteger(days) && days > 0 ? days : null,
      baseline_required: run.plan.baseline_required === true,
      target_required: run.plan.target_required === true,
      decision_gate: run.plan.decision_gate ?? null,
    } : null,
    authority: {
      publication: false,
      measurement: false,
      learning: false,
    },
    external_side_effect: false,
    next_action: state === 'READY_FOR_MEASUREMENT'
      ? 'record real observations with sources in the run's measurement evidence artifacts'
      : state === 'AWAITING_PUBLICATION'
        ? 'complete the separately gated publication path and obtain an authoritative receipt'
        : state === 'AWAITING_VERIFICATION'
          ? 'complete Stage 63 publication verification'
          : 'repair blocked publication or measurement evidence',
  };
}

function main() {
  const [command, runId] = process.argv.slice(2);
  if (command !== 'prepare' || !runId) throw new Error('usage: publication-measurement-intake-runtime.mjs prepare <run_id>');
  const run = load(runId);
  const result = inspect(run, runId);
  save(run.dir, 'publication-measurement-intake.json', result);
  console.log(JSON.stringify(result, null, 2));
  if (result.status === 'BLOCKED') process.exitCode = 2;
}
try { main(); } catch (error) {
  console.error('PUBLICATION-MEASUREMENT-INTAKE: ERROR ' + error.message);
  process.exitCode = 1;
}
