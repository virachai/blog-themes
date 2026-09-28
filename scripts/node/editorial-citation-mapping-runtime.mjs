#!/usr/bin/env node
/** Stage 25 — Editorial Citation Mapping Runtime. Deterministic claim/source mapping gate. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function stripHtml(input) {
  return input.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function urlsOf(source) {
  return /** @type {string[]} */ (source.match(/https?:\/\/[^\s"'<>]+/gi) || []).map(url => url.replace(/[),.;]+$/, ''));
}
function claimSignals(text) {
  const patterns = [
    /\b(?:according to|research|study|studies|report|survey|data|statistics|official|experts?|analysts?)\b[^.!?]{10,180}[.!?]/gi,
    /\b\d+(?:[.,]\d+)?%\b[^.!?]{0,180}[.!?]/gi
  ];
  const found = new Set();
  for (const pattern of patterns) for (const match of text.matchAll(pattern)) found.add(match[0].trim().replace(/\s+/g, ' '));
  return [...found].slice(0, 100);
}
function evidenceMarkers(text) {
  return (text.match(/\b(?:according to|source|sources|reference|references|reported by|cited by|via)\b/gi) || []).length;
}
function proximitySignals(text) {
  return (text.match(/(?:according to|reported by|source|sources|reference|references|cited by|via)[^.!?]{0,220}(?:https?:\/\/|\[[0-9]+\]|\([A-Za-z][^)]{0,40}\))/gi) || []).length;
}
function analyze(source, file) {
  const text = stripHtml(source), urls = urlsOf(source), claims = claimSignals(text);
  const markers = evidenceMarkers(text), proximity = proximitySignals(text);
  const orphanClaims = Math.max(0, claims.length - Math.max(urls.length, proximity));
  const orphanSources = Math.max(0, urls.length - claims.length);
  const checks = [
    { id: 'claims_detected', pass: claims.length > 0 || urls.length === 0, value: claims.length, target: 'claims are identifiable when sources exist' },
    { id: 'claim_source_ratio', pass: claims.length === 0 || urls.length >= Math.min(3, claims.length), value: urls.length, target: 'sources cover major claim signals' },
    { id: 'citation_markers', pass: claims.length === 0 || markers > 0, value: markers, target: 'citation/reference markers present' },
    { id: 'citation_proximity', pass: claims.length === 0 || proximity > 0, value: proximity, target: 'citations occur near claim/evidence language' },
    { id: 'orphan_claims', pass: orphanClaims === 0, value: orphanClaims, target: 'no detectable orphan claims' },
    { id: 'orphan_sources', pass: orphanSources === 0 || claims.length === 0, value: orphanSources, target: 'sources are attached to detectable claims or context' },
  ];
  const blockers = checks.filter(x => !x.pass).map(x => x.id);
  return {
    runtime: 'editorial-citation-mapping-runtime-v1', file,
    claim_count: claims.length, source_count: urls.length, evidence_marker_count: markers,
    citation_proximity_count: proximity, orphan_claim_count: orphanClaims, orphan_source_count: orphanSources,
    claims, sources: urls, checks,
    evidence_graph: claims.map((claim, index) => ({ claim_id: 'claim-' + (index + 1), claim, source_hint: urls[index] || null })),
    score: Math.round(checks.filter(x => x.pass).length / checks.length * 100),
    status: blockers.length ? 'REVISE' : 'PASS', blockers,
    citation_mapping_authority: false, evidence_authority: false, release_authority: false,
    release_gate: 'seo-quality-gate'
  };
}
const [command='check', file, ...rest] = process.argv.slice(2);
const json = rest.includes('--json');
const outputPath = rest.find(x => x.startsWith('--write='))?.slice(8);
try {
  if (command !== 'check' || !file) throw new Error('usage: editorial-citation-mapping-runtime.mjs check <article-file> [--json] [--write=<ledger.json>]');
  const path = resolve(file);
  if (!existsSync(path)) throw new Error('article file not found: ' + file);
  const report = analyze(readFileSync(path, 'utf8'), file);
  if (outputPath) writeFileSync(resolve(outputPath), JSON.stringify(report, null, 2) + '\n');
  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log('EDITORIAL-CITATION-MAPPING: ' + report.status);
    console.log('SCORE: ' + report.score + '/100');
    console.log('CLAIMS: ' + report.claim_count);
    console.log('SOURCES: ' + report.source_count);
    console.log('ORPHAN CLAIMS: ' + report.orphan_claim_count);
    console.log('ORPHAN SOURCES: ' + report.orphan_source_count);
    if (report.blockers.length) console.log('BLOCKERS: ' + report.blockers.join(', '));
  }
  if (report.status !== 'PASS') process.exitCode = 2;
} catch (error) {
  console.error('EDITORIAL-CITATION-MAPPING: ERROR ' + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
}
