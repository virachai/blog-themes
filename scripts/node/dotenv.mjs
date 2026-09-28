/**
 * .env loading for runtimes that read configuration from the environment.
 *
 * The repository keeps operator configuration in `.env` — the stage 62 notes say
 * so explicitly for EMAIL_FOR_POSTING and the SMTP block, and BLOGGER_TARGET_ID
 * lives there too. Only the email transport actually read that file, so every
 * other runtime saw an unset variable no matter what `.env` contained: a target
 * id configured there never reached the CDP session, and the runtime failed with
 * "BLOGGER_TARGET_ID is required" while the value sat in the file.
 *
 * Existing environment variables always win, so exporting a value for one run
 * overrides the file and nothing here can silently replace an explicit setting.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadDotEnv(root = process.cwd()) {
  const file = join(root, '.env');
  if (!existsSync(file)) return [];
  const loaded = [];
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
    loaded.push(match[1]);
  }
  return loaded;
}
