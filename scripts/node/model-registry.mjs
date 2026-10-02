#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REGISTRY = join(ROOT, ".agent-tasks", "registry.yaml");

function parseScalar(value) {
  const v = value.trim();
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^\d+$/.test(v)) return Number(v);
  return v.replace(/^['"]|['"]$/g, "");
}

export function loadRegistry() {
  const lines = readFileSync(REGISTRY, "utf8").split(/\r?\n/);
  const models = {};
  let model = null;
  let section = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+#.*$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (/^  [^ -][^:]*:$/.test(line)) {
      model = line.trim().slice(0, -1);
      models[model] = { capabilities: [], limits: {} };
      section = null;
      continue;
    }
    if (/^    [^:]+:$/.test(line)) {
      section = line.trim().slice(0, -1);
      continue;
    }
    if (section === "capabilities" && /^      - /.test(line)) {
      models[model].capabilities.push(line.trim().slice(2));
      continue;
    }
    const match = line.match(/^    ([^:]+):\s*(.+)$/);
    if (match && model) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (section === "limits") models[model].limits[key] = parseScalar(value);
      else models[model][key] = parseScalar(value);
    }
  }
  return { models };
}

export function authorize({ modelId, capability }) {
  const model = loadRegistry().models[modelId];
  if (!model) return { allowed: false, reason: `unknown model: ${modelId}` };
  if (!model.capabilities.includes(capability)) return { allowed: false, reason: `capability denied: ${capability}` };
  return { allowed: true, model };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [modelId, capability] = process.argv.slice(2);
  if (!modelId || !capability) throw new Error("usage: model-registry.mjs <model> <capability>");
  const result = authorize({ modelId, capability });
  console.log(JSON.stringify(result));
  if (!result.allowed) process.exitCode = 1;
}
