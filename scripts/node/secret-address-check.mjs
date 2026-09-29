// Blocks commits that stage a Mail2Blogger posting address (a publishing credential).
// Scans staged content (or all tracked files with --tree, for CI). Placeholder: [REDACTED]@blogger.com
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const patterns = [/[A-Za-z0-9._+-]+\.[0-9a-f]{20}@blogger\.com/g];
const literals = [];
try {
  const m = fs.readFileSync('.env', 'utf8').match(/^\s*EMAIL_FOR_POSTING\s*=\s*"?([^"\r\n#]+?)"?\s*$/m);
  if (m && m[1].includes('@')) literals.push(m[1].trim());
} catch {}

const tree = process.argv.includes('--tree'); // CI: scan every tracked file
const staged = execSync(tree ? 'git ls-files -z' : 'git diff --cached --name-only --diff-filter=ACMR -z').toString().split('\0').filter(Boolean);
const hits = [];
for (const f of staged) {
  let text;
  try { text = tree ? fs.readFileSync(f, 'utf8') : execSync(`git show :"${f}"`, { maxBuffer: 64 * 1024 * 1024 }).toString('utf8'); } catch { continue; }
  if (text.includes('\0')) continue;
  if ((patterns.some((re) => { re.lastIndex = 0; return re.test(text); }) || literals.some((v) => text.includes(v)))) hits.push(f);
}

if (hits.length) {
  console.error('SECRET-ADDRESS-CHECK: FAIL (Mail2Blogger address staged; replace with [REDACTED]@blogger.com and recompute the .json fingerprint)');
  for (const f of hits) console.error(`- ${f}`);
  process.exit(1);
}
console.log('SECRET-ADDRESS-CHECK: PASS');
