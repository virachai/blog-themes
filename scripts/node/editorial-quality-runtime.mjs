#!/usr/bin/env node
/** Stage 21 — Editorial Quality Runtime. Deterministic, fail-closed content quality gate. */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const THRESHOLDS = { words: 700, headings: 3, paragraphs: 5, links: 1, titleMin: 20, titleMax: 70, score: 80 };

function stripHtml(input) {
  return input.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
}
function count(text, regex) { return (text.match(regex) || []).length; }
function words(text) { return text ? text.split(/\s+/).filter(Boolean).length : 0; }
function titleOf(source) { return source.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || source.match(/^#\s+(.+)$/m)?.[1]?.trim() || ''; }

export function analyze(source, file) {
  const text = stripHtml(source);
  const title = titleOf(source);
  const headings = count(source, /^#{2,6}\s+/gm) + count(source, /<h[2-6][^>]*>/gi);
  const paragraphs = count(source, /<p(?:\s[^>]*)?>/gi) || count(source, /^(?!#|\s)(.+)$/gm);
  const links = count(source, /<a\b[^>]*href=/gi) + count(source, /\[[^\]]+\]\((https?:\/\/[^)]+)\)/g);
  const images = count(source, /<img\b/gi) + count(source, /!\[[^\]]*\]\([^)]*\)/g);
  const sentenceCount = Math.max(1, count(text, /[.!?]+(?=\s|$)/g));
  const avgSentenceWords = words(text) / sentenceCount;
  const checks = [
    { id: 'title', pass: title.length >= THRESHOLDS.titleMin && title.length <= THRESHOLDS.titleMax, value: title.length, target: '20–70 chars' },
    { id: 'word_count', pass: words(text) >= THRESHOLDS.words, value: words(text), target: '>= 700 words' },
    { id: 'headings', pass: headings >= THRESHOLDS.headings, value: headings, target: '>= 3 headings' },
    { id: 'paragraphs', pass: paragraphs >= THRESHOLDS.paragraphs, value: paragraphs, target: '>= 5 paragraphs' },
    { id: 'links', pass: links >= THRESHOLDS.links, value: links, target: '>= 1 link' },
    { id: 'media', pass: images >= 1 || words(text) < 1200, value: images, target: 'image for long-form content' },
    { id: 'sentence_length', pass: avgSentenceWords <= 28, value: Number(avgSentenceWords.toFixed(1)), target: '<= 28 words/sentence' },
    { id: 'intent', pass: count(text, /\?/g) >= 1 || headings >= 4, value: count(text, /\?/g), target: 'question or deeper structure' },
  ];
  const passed = checks.filter(x => x.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  const blockers = checks.filter(x => !x.pass).map(x => x.id);
  return {
    runtime: 'editorial-quality-runtime-v1', file, title,
    metrics: { word_count: words(text), headings, paragraphs, links, images, avg_sentence_words: Number(avgSentenceWords.toFixed(1)) },
    checks, score, status: score >= THRESHOLDS.score && blockers.length === 0 ? 'PASS' : 'REVISE',
    blockers, release_authority: false, release_gate: 'seo-quality-gate'
  };
}

const [command = 'check', file, ...rest] = process.argv.slice(2);
const json = rest.includes('--json');
try {
  if (command !== 'check' || !file) throw new Error('usage: editorial-quality-runtime.mjs check <article-file> [--json]');
  const path = resolve(file);
  if (!existsSync(path)) throw new Error('article file not found: ' + file);
  const report = analyze(readFileSync(path, 'utf8'), file);
  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log('EDITORIAL-QUALITY: ' + report.status);
    console.log('SCORE: ' + report.score + '/100');
    console.log('TITLE: ' + report.title);
    console.log('METRICS: ' + JSON.stringify(report.metrics));
    if (report.blockers.length) console.log('BLOCKERS: ' + report.blockers.join(', '));
  }
  if (report.status !== 'PASS') process.exitCode = 2;
} catch (error) {
  console.error('EDITORIAL-QUALITY: ERROR ' + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
}
