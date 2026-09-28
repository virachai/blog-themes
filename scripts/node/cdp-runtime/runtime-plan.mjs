import { resolveCapabilities } from './capability.mjs';

export function createRuntimePlan({ task, route, capabilities = {} }) {
  const requested = resolveCapabilities({ ...capabilities, trace: capabilities.trace ?? true, evidence: capabilities.evidence ?? true });
  return {
    version: 1,
    runtime: 'meefunblog-agent-runtime-v2',
    objective: task,
    route,
    capabilities: requested,
    phases: [
      { id: 'PLAN', status: 'READY' },
      { id: 'SESSION', status: 'READY' },
      { id: 'OBSERVE', status: 'READY' },
      { id: 'EXECUTE', status: 'READY' },
      { id: 'TRACE', status: requested.includes('browser-trace') ? 'READY' : 'SKIPPED' },
      { id: 'EVIDENCE', status: requested.includes('evidence') ? 'READY' : 'SKIPPED' },
      { id: 'VALIDATE', status: 'READY' },
      { id: 'REPORT', status: 'READY' },
    ],
    security: { challenge: 'HUMAN_HANDOFF', auth: 'EXPLICIT_SESSION', bypass: false },
  };
}
