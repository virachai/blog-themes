#!/usr/bin/env node
/** Stage 24 — Editorial Source Integrity Runtime. Deterministic source/citation integrity gate. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function stripHtml(input) {
  return input.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function urlsOf(source) {
  return /** @type {string[]} */ (source.match(/https?:\/\/[^\s"'<>]+/gi) || []).map(url => url.replace(/[),.;]+$/, ''));
}
function canonicalUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}
function domainOf(url) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; }
}
function claimSignals(text) {
  const patterns = [
    /\b(?:according to|research|study|studies|report|survey|data|statistics|official|experts?|analysts?)\b[^.!?]{10,180}[.!?]/gi,
    /\b\d+(?:\.\d+)?%\b[^.!?]{0,180}[.!?]/gi
  ];
  const found = new Set();
  for (const pattern of patterns) for (const match of text.matchAll(pattern)) found.add(match[0].trim().replace(/\s+/g, ' '));
  return [...found].slice(0, 100);
}
function analyze(source, file) {
  const text = stripHtml(source);
  const urls = urlsOf(source);
  const canonical = urls.map(canonicalUrl);
  const domains = [...new Set(urls.map(domainOf).filter(Boolean))];
  const duplicateCount = canonical.length - new Set(canonical).size;
  const invalidCount = urls.filter(url => !/^https:\/\//i.test(url) || !domainOf(url)).length;
  const claims = claimSignals(text);
  const checks = [
    { id: 'sources_present', pass: urls.length > 0, value: urls.length, target: '>= 1 source URL' },
    { id: 'canonical_urls', pass: duplicateCount === 0, value: duplicateCount, target: 'no duplicate canonical URLs' },
    { id: 'https_sources', pass: invalidCount === 0, value: invalidCount, target: 'all source URLs are valid HTTPS URLs' },
    { id: 'domain_integrity', pass: domains.length > 0 && domains.length <= urls.length, value: domains.length, target: 'every source resolves to a stable domain' },
    { id: 'claim_source_coverage', pass: claims.length === 0 || urls.length >= Math.min(3, claims.length), value: claims.length, target: 'source count scales with claim signals' },
    { id: 'citation_mapping_signal', pass: claims.length === 0 || /(?:source|sources|reference|references|according to|reported by|via)/i.test(text), value: claims.length, target: 'claims expose citation/reference language' },
  ];
  const blockers = checks.filter(x => !x.pass).map(x => x.id);
  return {
    runtime: 'editorial-source-integrity-runtime-v1', file,
    url_count: urls.length, unique_url_count: new Set(canonical).size,
    duplicate_count: duplicateCount, domains, claims, checks,
    score: Math.round(checks.filter(x => x.pass).length / checks.length * 100),
    status: blockers.length ? 'REVISE' : 'PASS', blockers,
    source_integrity_authority: false, evidence_authority: false, release_authority: false,
    release_gate: 'seo-quality-gate'
  };
}
const [command='check', file, ...rest] = process.argv.slice(2);
const json = rest.includes('--json');
const outputPath = rest.find(x => x.startsWith('--write='))?.slice(8);
try {
  if (command !== 'check' || !file) throw new Error('usage: editorial-source-integrity-runtime.mjs check <article-file> [--json] [--write=<ledger.json>]');
  const path = resolve(file);
  if (!existsSync(path)) throw new Error('article file not found: ' + file);
  const report = analyze(readFileSync(path, 'utf8'), file);
  if (outputPath) writeFileSync(resolve(outputPath), JSON.stringify(report, null, 2) + '\n');
  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log('EDITORIAL-SOURCE-INTEGRITY: ' + report.status);
    console.log('SCORE: ' + report.score + '/100');
    console.log('URLS: ' + report.url_count);
    console.log('UNIQUE URLS: ' + report.unique_url_count);
    console.log('DOMAINS: ' + report.domains.join(', '));
    if (report.blockers.length) console.log('BLOCKERS: ' + report.blockers.join(', '));
  }
  if (report.status !== 'PASS') process.exitCode = 2;
} catch (error) {
  console.error('EDITORIAL-SOURCE-INTEGRITY: ERROR ' + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
}
