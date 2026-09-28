#!/usr/bin/env node
/** Stage 22 — Editorial Evidence Runtime. Deterministic claim/source coverage gate. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function stripHtml(input) { return input.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function count(text, regex) { return (text.match(regex) || []).length; }
function sourcesOf(source) { return /** @type {string[]} */ (source.match(/https?:\/\/[^\s"'<>]+/gi) || []); }
function analyze(source, file) {
  const text = stripHtml(source), claims = claimsOf(text), sources = sourcesOf(source);
  const checks = [
    { id: 'claims_detected', pass: claims.length > 0, value: claims.length, target: 'claims identified for review' },
    { id: 'sources_present', pass: sources.length > 0, value: sources.length, target: '>= 1 source URL' },
    { id: 'https', pass: sources.every(url => /^https:\/\//i.test(url)), value: sources.filter(url => /^https:\/\//i.test(url)).length, target: 'all sources HTTPS' },
    { id: 'source_density', pass: claims.length === 0 || sources.length >= Math.min(3, claims.length), value: sources.length, target: 'sources scale with claim signals' },
  ];
  const blockers = checks.filter(x => !x.pass).map(x => x.id);
  return { runtime:'editorial-evidence-runtime-v1', file, claim_count:claims.length, source_count:sources.length, claims, sources, checks, score:Math.round(checks.filter(x=>x.pass).length/checks.length*100), status:blockers.length?'REVISE':'PASS', blockers, evidence_authority:false, release_authority:false, release_gate:'seo-quality-gate' };
}
const [command='check', file, ...rest] = process.argv.slice(2), json = rest.includes('--json'), outputPath = rest.find(x=>x.startsWith('--write='))?.slice(8);
try {
  if (command !== 'check' || !file) throw new Error('usage: editorial-evidence-runtime.mjs check <article-file> [--json] [--write=<ledger.json>]');
  const path=resolve(file); if(!existsSync(path)) throw new Error('article file not found: '+file);
  const report=analyze(readFileSync(path,'utf8'),file); if(outputPath) writeFileSync(resolve(outputPath),JSON.stringify(report,null,2)+'\n');
  if(json) console.log(JSON.stringify(report,null,2)); else { console.log('EDITORIAL-EVIDENCE: '+report.status); console.log('SCORE: '+report.score+'/100'); console.log('CLAIMS: '+report.claim_count); console.log('SOURCES: '+report.source_count); if(report.blockers.length) console.log('BLOCKERS: '+report.blockers.join(', ')); }
  if(report.status!=='PASS') process.exitCode=2;
} catch(error) { console.error('EDITORIAL-EVIDENCE: ERROR '+(error instanceof Error?error.message:String(error))); process.exitCode=1; }
