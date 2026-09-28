/**
 * Publication payload resolution — one definition of where a post title comes from.
 *
 * Stage 61's publish path reads `run.asset?.title`, and the asset spec is built by
 * value-mission-asset-runtime.mjs from the mission block. That mission block has
 * `issue`, `thesis`, `problem` and `audience` but no title at all, so `title` was
 * always '' and `blogger-publication-adapter.mjs` threw "publication payload
 * requires title and body" on every asset shaped like VLM-001. The publish path
 * was structurally unreachable, and the failure looked like a payload problem
 * rather than a missing field.
 *
 * The title is now a declared mission field, emitted into the asset spec, and
 * resolved through one chain here so the adapter, the transport and the asset
 * builder cannot disagree about it.
 */

/** Declared sources for a post title, in precedence order (a caller-supplied override wins). */
export const TITLE_SOURCES = Object.freeze(['override', 'asset.title', 'mission.title']);

const asText = value => typeof value === 'string' ? value.trim() : '';

/**
 * Resolve the title for a publication payload.
 * @returns {{ title: string|null, source: string|null }} source is null when nothing declared a title.
 */
export function resolvePublicationTitle({ mission = null, asset = null, override = null } = {}) {
  for (const [source, value] of [['override', override], ['asset.title', asset?.title], ['mission.title', mission?.title]]) {
    const text = asText(value);
    if (text) return { title: text, source };
  }
  return { title: null, source: null };
}

/**
 * The body is operator-supplied, never derived: it is the drafted content, and
 * inventing it would be fabrication.
 */
export function resolvePublicationBody({ override = null } = {}) {
  const text = asText(override);
  return { body: text || null, source: text ? 'override' : null };
}

/**
 * Fail-closed payload gate. Names the missing part and where it must come from,
 * so the operator sees "declare mission.title" rather than a generic payload error.
 */
export function assertPublicationPayload({ title, body }) {
  const missing = [];
  if (!asText(title)) missing.push('title');
  if (!asText(body)) missing.push('body');
  if (missing.length) {
    throw new Error(
      'publication payload requires ' + missing.join(' and ') + ' — ' +
      [
        missing.includes('title') ? 'declare mission.title in manifest.json so the asset spec derives it (asset.title and the caller override are the other accepted sources)' : null,
        missing.includes('body') ? 'provide the drafted body via BLOGGER_BODY' : null,
      ].filter(Boolean).join('; ')
    );
  }
  return { title: asText(title), body: asText(body) };
}
