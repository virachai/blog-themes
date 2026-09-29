#!/usr/bin/env node
/** Stage 62 — Email-to-Blogger Publication Transport. */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import tls from 'node:tls';
import { resolvePublicationTitle, assertPublicationPayload } from './publication-payload.mjs';

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
  if (!['RELEASE_CANDIDATE', 'READY'].includes(run.asset?.status)) blockers.push('asset_not_ready');
  if (!env('EMAIL_FOR_POSTING')) blockers.push('EMAIL_FOR_POSTING_missing');
  return { status: blockers.length ? 'BLOCKED' : 'PASS', blockers };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineMarkdown(value) {
  let html = escapeHtml(value);
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
  return html;
}

function nextPostId() {
  const blogDir = join(ROOT, '02-meefunblog');
  const files = readdirSync(blogDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.html'))
    .map(entry => join(blogDir, entry.name));
  const ids = files
    .flatMap(file => [...text(file).matchAll(/data-id=["'](\d{4})["']/g)].map(match => Number(match[1])));
  const next = (ids.length ? Math.max(...ids) : 0) + 1;
  return String(next).padStart(4, '0');
}

function optimizeImageUrl(src, role = 'body') {
  const value = String(src || '').trim();
  if (!value) return value;

  // Pexels exposes CDN variants via query parameters. Keep non-Pexels URLs
  // untouched so publication does not depend on a provider-specific contract.
  if (!/^https?:\/\/images\.pexels\.com\//i.test(value)) return value;

  const url = new URL(value);
  url.searchParams.set('auto', 'compress');
  url.searchParams.set('cs', 'tinysrgb');
  url.searchParams.set('w', role === 'lead' ? '1200' : '940');
  return url.toString();
}

function imageHtml(alt, src, lazy = false, role = 'body') {
  const safeAlt = escapeHtml(alt || '');
  const safeSrc = escapeHtml(optimizeImageUrl(src, role));
  return '<div class="separator"><img src="' + safeSrc + '" alt="' + safeAlt + '"' + (lazy ? ' loading="lazy"' : '') + '></div>';
}

function markdownToHtml(markdown) {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let list = null;
  let quote = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (!list) return;
    blocks.push({ type: list.type, items: list.items.slice() });
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) {
      blocks.push({ type: 'quote', lines: quote.slice() });
      quote = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushParagraph(); flushList(); flushQuote();
      continue;
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flushParagraph(); flushList(); flushQuote();
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      continue;
    }

    const image = line.match(/^\s*!\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+["']([^"']+)["'])?\)\s*$/);
    if (image) {
      flushParagraph(); flushList(); flushQuote();
      blocks.push({ type: 'image', alt: image[1], src: image[2], caption: image[3] || '' });
      continue;
    }

    const quoteLine = line.match(/^\s*>\s?(.*)$/);
    if (quoteLine) {
      flushParagraph(); flushList();
      quote.push(quoteLine[1]);
      continue;
    }

    const item = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (item || ordered) {
      flushParagraph(); flushQuote();
      const type = ordered ? 'ol' : 'ul';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((item || ordered)[1]);
      continue;
    }

    flushList(); flushQuote();
    paragraph.push(line.trim());
  }

  flushParagraph(); flushList(); flushQuote();

  const id = nextPostId();
  const firstImageIndex = blocks.findIndex(block => block.type === 'image');
  const summaryIndex = blocks.findIndex((block, index) =>
    block.type === 'paragraph' && (firstImageIndex === -1 || index > firstImageIndex)
  );
  const out = ['<div class="mp-id" data-id="' + id + '"></div>'];

  let leadCredit = '';
  if (firstImageIndex >= 0) {
    const lead = blocks[firstImageIndex];
    leadCredit = lead.caption || '';
    out.push(imageHtml(lead.alt, lead.src, false, 'lead'));
  }

  if (summaryIndex >= 0) {
    out.push('<div class="mp-summary">');
    out.push('  <p>' + inlineMarkdown(blocks[summaryIndex].text) + '</p>');
    out.push('</div>');
  }

  let tocInserted = false;
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (index === firstImageIndex || index === summaryIndex) continue;

    if (block.type === 'heading') {
      if (block.level === 1) continue;
      const level = Math.min(block.level, 6);
      const title = inlineMarkdown(block.text).replace(/<[^>]+>/g, '');
      if (level === 2 && !tocInserted) {
        out.push('<div id="toc_container"><h2>สารบัญ</h2></div>');
        tocInserted = true;
      }
      out.push('<h' + level + (level === 2 ? ' title="' + escapeHtml(title) + '"' : '') + '>' + inlineMarkdown(block.text) + '</h' + level + '>');
      continue;
    }

    if (block.type === 'paragraph') {
      if (/^ภาพนำ\s*:/i.test(block.text)) {
        leadCredit = block.text.replace(/^ภาพนำ\s*:\s*/i, '').trim();
        continue;
      }
      out.push('<p>' + inlineMarkdown(block.text) + '</p>');
      continue;
    }

    if (block.type === 'ul' || block.type === 'ol') {
      out.push('<' + block.type + '>\n' + block.items.map(item => '  <li>' + inlineMarkdown(item) + '</li>').join('\n') + '\n</' + block.type + '>');
      continue;
    }

    if (block.type === 'quote') {
      out.push('<blockquote>\n' + block.lines.map(line => '<p>' + inlineMarkdown(line) + '</p>').join('\n') + '\n</blockquote>');
      continue;
    }

    if (block.type === 'image') {
      out.push(imageHtml(block.alt, block.src, true));
      let caption = block.caption || '';
      const next = blocks[index + 1];
      if (!caption && next?.type === 'paragraph' && /^ภาพ\s*:/i.test(next.text)) {
        caption = next.text.replace(/^ภาพ\s*:\s*/i, '').trim();
        index += 1;
      }
      if (caption) out.push('<p class="mp-caption">ภาพ: ' + inlineMarkdown(caption) + '</p>');
    }
  }

  if (leadCredit) out.push('<p class="mp-credits">ภาพนำ: ' + inlineMarkdown(leadCredit) + '</p>');
  return out.join('\n');
}

function compose(run) {
  const resolvedTitle = resolvePublicationTitle({ mission: run.manifest?.mission, asset: run.asset, override: env('BLOGGER_EMAIL_TITLE') });
  const markdown = env('BLOGGER_EMAIL_BODY') || run.package;
  const { title } = assertPublicationPayload({ title: resolvedTitle.title, body: markdown });
  const runMarker = escapeHtml(run.run_id || run.manifest?.run_id || '');
  const html = markdownToHtml(markdown).replace(/^(<div class="mp-id" data-id="[^\"]+")/, '$1 data-run-id="' + runMarker + '"');
  const to = env('EMAIL_FOR_POSTING');
  const from = env('EMAIL_FROM');
  // Blogger Mail2Blogger can ingest the text/plain alternative instead of the
  // HTML alternative. Send a single-part text/html message so the published
  // post is deterministically the same HTML protocol we prepared.
  const lines = [
    'To: ' + to,
    from ? 'From: ' + from : '',
    'Subject: ' + title,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    '',
  ].filter(Boolean);
  const eml = lines.join('\r\n');
  return { to, from: from || null, subject: title, body: markdown, html, eml, fingerprint: sha(eml) };
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

async function readSmtpResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const cleanup = () => {
      socket.off('data', onData);
      socket.off('error', onError);
      socket.off('close', onClose);
    };
    const onData = chunk => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        const match = line.match(/^(\d{3})([ -])(.*)$/);
        if (match && match[2] === '-') continue;
        if (match) {
          cleanup();
          resolve({ code: Number(match[1]), text: match[3] });
          return;
        }
      }
    };
    const onError = error => { cleanup(); reject(error); };
    const onClose = () => { cleanup(); reject(new Error('SMTP connection closed unexpectedly')); };
    socket.on('data', onData);
    socket.once('error', onError);
    socket.once('close', onClose);
  });
}

async function smtpCommand(socket, command, expected) {
  socket.write(command + '\r\n');
  const response = await readSmtpResponse(socket);
  if (!expected.includes(response.code)) throw new Error('SMTP command failed: ' + response.code);
  return response;
}

async function sendViaSmtp(message) {
  const cfg = transportConfig();
  const missing = ['EMAIL_SMTP_HOST', 'EMAIL_SMTP_USER', 'EMAIL_SMTP_PASSWORD', 'EMAIL_FROM'].filter(k => !env(k));
  if (missing.length) throw new Error('SMTP configuration missing: ' + missing.join(', '));
  if (!Number.isInteger(cfg.port) || cfg.port < 1 || cfg.port > 65535) throw new Error('invalid EMAIL_SMTP_PORT');

  let socket = await new Promise((resolve, reject) => {
    const s = cfg.secure
      ? tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host })
      : net.createConnection({ host: cfg.host, port: cfg.port });
    const timer = setTimeout(() => { s.destroy(); reject(new Error('SMTP connection timeout')); }, 30000);
    const ready = () => { clearTimeout(timer); resolve(s); };
    s.once('error', error => { clearTimeout(timer); reject(new Error('SMTP connection failed: ' + error.message)); });
    s.once('connect', ready);
    if (cfg.secure) s.once('secureConnect', ready);
  });

  try {
    let response = await readSmtpResponse(socket);
    if (response.code !== 220) throw new Error('SMTP greeting failed: ' + response.code);
    response = await smtpCommand(socket, 'EHLO localhost', [250]);

    if (!cfg.secure && cfg.port === 587) {
      await smtpCommand(socket, 'STARTTLS', [220]);
      socket = await new Promise((resolve, reject) => {
        const tlsSocket = tls.connect({ socket, servername: cfg.host }, () => resolve(tlsSocket));
        tlsSocket.once('error', reject);
      });
      await smtpCommand(socket, 'EHLO localhost', [250]);
    }

    await smtpCommand(socket, 'AUTH PLAIN ' + Buffer.from('\0' + cfg.user + '\0' + cfg.password).toString('base64'), [235]);
    await smtpCommand(socket, 'MAIL FROM:<' + message.from + '>', [250]);
    await smtpCommand(socket, 'RCPT TO:<' + message.to + '>', [250, 251]);
    await smtpCommand(socket, 'DATA', [354]);

    const data = message.eml.replace(/\\r?\\n/g, '\\r\\n').replace(/^\\./gm, '..');
    socket.write(data + '\\r\\n.\\r\\n');
    response = await readSmtpResponse(socket);
    if (response.code !== 250) throw new Error('SMTP message rejected: ' + response.code);
    const acceptance = { code: response.code, text: response.text, message_bytes: Buffer.byteLength(data, 'utf8') };
    await smtpCommand(socket, 'QUIT', [221, 250]);
    return acceptance;
  } finally {
    socket.end();
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

  if (command === 'plan') { console.log(JSON.stringify(plan, null, 2)); return; }
  let message;
  const preparedPath = join(run.dir, 'email-publication-message.json');
  if (command === 'send' && existsSync(preparedPath)) {
    const prepared = json(preparedPath);
    const preparedEmlPath = join(run.dir, 'email-publication-message.eml');
    const preparedEml = existsSync(preparedEmlPath) ? readFileSync(preparedEmlPath, 'utf8') : '';
    if (!prepared?.fingerprint || !prepared?.to || !prepared?.subject || !preparedEml) throw new Error('prepared message is incomplete');
    message = { ...prepared, from: prepared.from || null, eml: preparedEml };
    if (sha(message.eml) !== message.fingerprint) throw new Error('prepared message fingerprint mismatch');
  } else {
    message = compose(run);
    save(run.dir, 'email-publication-message.json', { ...message, eml: undefined });
    writeFileSync(join(run.dir, 'email-publication-message.eml'), message.eml);
  }
  if (command === 'prepare') {
    console.log(JSON.stringify({ ...plan, status: pf.status, message: { to_configured: !!message.to, subject: message.subject, fingerprint: message.fingerprint }, action: 'NO_EXTERNAL_SIDE_EFFECT' }, null, 2));
    return;
  }
  if (pf.status !== 'PASS') {
    console.log(JSON.stringify({ ...plan, action: 'BLOCKED', external_side_effect: false }, null, 2));
    return;
  }
  if (env('EMAIL_PUBLISH_CONFIRM') !== 'YES') throw new Error('EMAIL_PUBLISH_CONFIRM=YES is required for external publication');
  const smtpAcceptance = await sendViaSmtp(message);
  const sentAt = new Date().toISOString();
  save(run.dir, 'email-publication-result.json', {
    runtime: 'email-to-blogger-publication-transport-v1',
    run_id: runId,
    status: 'EMAIL_SENT',
    sent_at: sentAt,
    recipient: message.to,
    subject: message.subject,
    fingerprint: message.fingerprint,
    smtp_acceptance: smtpAcceptance,
    envelope: {
      recipient_matches_prepared: message.to === env('EMAIL_FOR_POSTING'),
      from_matches_configured: message.from === env('EMAIL_FROM'),
    },
    message: {
      mime_type: 'text/html',
      bytes_after_crlf_normalisation: smtpAcceptance.message_bytes,
    },
    observation: 'EMAIL_SENT_IS_NOT_PUBLICATION_PROOF'
  });
  console.log(JSON.stringify({
    runtime: 'email-to-blogger-publication-transport-v1',
    stage: 62,
    run_id: runId,
    status: 'EMAIL_SENT',
    sent_at: sentAt,
    message_fingerprint: message.fingerprint,
    smtp_acceptance: smtpAcceptance,
    envelope: {
      recipient_matches_prepared: message.to === env('EMAIL_FOR_POSTING'),
      from_matches_configured: message.from === env('EMAIL_FROM'),
    },
    action: 'EMAIL_SENT_ONLY',
    next: 'observe Blogger publication before creating publication receipt'
  }, null, 2));
}

main().catch(error => { console.error('EMAIL-BLOGGER-TRANSPORT: ERROR ' + error.message); process.exitCode = 1; });
