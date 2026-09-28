#!/usr/bin/env node
/** Stage 62 — Email-to-Blogger Publication Transport. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const RUNS = join(ROOT, '04-revenue-system/07-intelligence/runs');

function loadDotEnv() {
  const file = join(ROOT, '.env');
  if (!existsSync(file)) return;
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[m[1]] = value;
  }
}
loadDotEnv();

const json = file => existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
const text = file => existsSync(file) ? readFileSync(file, 'utf8') : '';
const save = (dir, name, value) => writeFileSync(join(dir, name), JSON.stringify(value, null, 2) + '\n');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const env = key => process.env[key]?.trim() || '';

function loadRun(runId) {
  const dir = join(RUNS, runId);
  const manifest = json(join(dir, 'manifest.json'));
  if (!manifest) throw new Error('run not found: ' + runId);
  return {
    dir,
    manifest,
    release: json(join(dir, 'release-candidate.json')),
    asset: json(join(dir, 'asset-spec.json')),
    package: text(join(dir, 'asset-package.md')),
  };
}

function preflight(run) {
  const blockers = [];
  if (run.release?.status !== 'READY_FOR_RELEASE_APPROVAL') blockers.push('release_not_ready');
  if (run.release?.approval?.status !== 'APPROVED') blockers.push('human_approval_required');
  if (run.asset?.status !== 'READY') blockers.push('asset_not_ready');
  if (!env('EMAIL_FOR_POSTING')) blockers.push('EMAIL_FOR_POSTING_missing');
  return { status: blockers.length ? 'BLOCKED' : 'PASS', blockers };
}

function compose(run) {
  const title = run.asset?.title || env('BLOGGER_EMAIL_TITLE') || run.manifest?.mission_id || run.manifest?.run_id;
  const body = env('BLOGGER_EMAIL_BODY') || run.package;
  if (!body.trim()) throw new Error('publication body is empty');
  const to = env('EMAIL_FOR_POSTING');
  const from = env('EMAIL_FROM');
  const lines = [
    `To: ${to}`,
    from ? `From: ${from}` : '',
    `Subject: ${title}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    '',
    body.trim(),
    '',
  ].filter(Boolean);
  const eml = lines.join('\r\n');
  return { to, from: from || null, subject: title, body, eml, fingerprint: sha(eml) };
}

function transportConfig() {
  return {
    host: env('EMAIL_SMTP_HOST'),
    port: Number(env('EMAIL_SMTP_PORT') || 587),
    user: env('EMAIL_SMTP_USER'),
    password: env('EMAIL_SMTP_PASSWORD'),
    secure: env('EMAIL_SMTP_SECURE') === 'true',
  };
}

function sendViaCurl(message) {
  const cfg = transportConfig();
  const missing = ['EMAIL_SMTP_HOST', 'EMAIL_SMTP_USER', 'EMAIL_SMTP_PASSWORD', 'EMAIL_FROM'].filter(k => !env(k));
  if (missing.length) throw new Error('SMTP configuration missing: ' + missing.join(', '));
  const file = join('/tmp', `blogger-email-${process.pid}-${Date.now()}.eml`);
  writeFileSync(file, message.eml, { mode: 0o600 });
  try {
    const url = `${cfg.secure ? 'smtps' : 'smtp'}://${cfg.host}:${cfg.port}`;
    const args = ['--fail', '--silent', '--show-error', '--url', url, '--user', `${cfg.user}:${cfg.password}`, '--mail-from', cfg.user, '--mail-rcpt', message.to, '--upload-file', file];
    execFileSync('curl', args, { stdio: 'pipe', encoding: 'utf8' });
  } finally {
    try { writeFileSync(file, '', { flag: 'w' }); } catch {}
  }
}

async function main() {
  const [command, runId] = process.argv.slice(2);
  if (!runId || !['plan', 'prepare', 'send'].includes(command)) throw new Error('usage: email-to-blogger-publication-transport.mjs plan|prepare|send <run_id>');
  const run = loadRun(runId);
  const pf = preflight(run);
  const plan = {
    runtime: 'email-to-blogger-publication-transport-v1', stage: 62, run_id: runId,
    status: pf.status, preflight: pf,
    transport: 'email-to-blogger', recipient_configured: !!env('EMAIL_FOR_POSTING'),
    external_side_effect: command === 'send', receipt: 'NOT_CREATED_UNTIL_PUBLICATION_OBSERVED',
    safety: { approval_required: true, idempotency_required: true, send_requires_explicit_command: true, secrets_never_logged: true }
  };
  save(run.dir, 'email-publication-plan.json', plan);
  if (command === 'plan') { console.log(JSON.stringify(plan, null, 2)); return; }
  const message = compose(run);
  save(run.dir, 'email-publication-message.json', { ...message, eml: undefined });
  writeFileSync(join(run.dir, 'email-publication-message.eml'), message.eml);
  if (command === 'prepare') {
    console.log(JSON.stringify({ ...plan, status: pf.status, message: { to_configured: !!message.to, subject: message.subject, fingerprint: message.fingerprint }, action: 'NO_EXTERNAL_SIDE_EFFECT' }, null, 2));
    return;
  }
  if (pf.status !== 'PASS') {
    console.log(JSON.stringify({ ...plan, action: 'BLOCKED', external_side_effect: false }, null, 2));
    return;
  }
  if (env('EMAIL_PUBLISH_CONFIRM') !== 'YES') throw new Error('EMAIL_PUBLISH_CONFIRM=YES is required for external publication');
  sendViaCurl(message);
  const sentAt = new Date().toISOString();
  save(run.dir, 'email-publication-result.json', { runtime: 'email-to-blogger-publication-transport-v1', run_id: runId, status: 'EMAIL_SENT', sent_at: sentAt, recipient: message.to, subject: message.subject, fingerprint: message.fingerprint, observation: 'EMAIL_SENT_IS_NOT_PUBLICATION_PROOF' });
  console.log(JSON.stringify({ runtime: 'email-to-blogger-publication-transport-v1', stage: 62, run_id: runId, status: 'EMAIL_SENT', sent_at: sentAt, message_fingerprint: message.fingerprint, action: 'EMAIL_SENT_ONLY', next: 'observe Blogger publication before creating publication receipt' }, null, 2));
}

main().catch(error => { console.error('EMAIL-BLOGGER-TRANSPORT: ERROR ' + error.message); process.exitCode = 1; });
