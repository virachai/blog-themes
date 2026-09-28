export const CAPABILITIES = Object.freeze({
  browser_session: 'browser-session',
  navigation: 'navigation',
  observation: 'observation',
  extraction: 'extraction',
  interaction: 'interaction',
  security: 'security-boundary',
  trace: 'browser-trace',
  evidence: 'evidence',
});

export function resolveCapabilities(task = {}) {
  const requested = new Set(task.capabilities || []);
  if (task.url) requested.add(CAPABILITIES.navigation);
  if (task.observe) requested.add(CAPABILITIES.observation);
  if (task.extract) requested.add(CAPABILITIES.extraction);
  if (task.interact) requested.add(CAPABILITIES.interaction);
  if (task.trace) requested.add(CAPABILITIES.trace);
  if (task.evidence) requested.add(CAPABILITIES.evidence);
  return [...requested];
}
