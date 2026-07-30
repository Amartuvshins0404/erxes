import type { ChartSpec } from '~/modules/chat/charts';

// The artifact contract + the ONE normalizer, kept free of runtime imports (only
// a type-only ChartSpec) so it is unit-testable in isolation and shared verbatim
// by every surface — the inline ArtifactCards AND the Files panel. Mirrors the
// backend contract at backend/plugins/erxes-agent_api/src/mastra/tools/artifacts.ts

// The formats the backend currently renders (DOCUMENT_FORMATS on the API side).
// Used only as a display hint (icon/label) — NEVER as a gate. A document is
// valid by its `kind`, so a format the backend adds flows through untouched.
export type DocumentFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx';

export interface ChartArtifact {
  id: string;
  kind: 'chart';
  title: string;
  spec: ChartSpec;
}

export interface DocumentArtifact {
  id: string;
  kind: 'document';
  // Free-form on purpose — see DocumentFormat above. The viewer/card pick an
  // icon and renderer from it and fall back gracefully for anything unknown.
  format: string;
  title: string;
  fileName: string;
  mimeType: string;
  // Storage key (read via core's /read-file) OR an inline data:/http URL.
  fileKey: string;
  inline?: boolean;
  size?: number;
}

export type Artifact = ChartArtifact | DocumentArtifact;

/**
 * Normalize ANY raw artifact shape into the one UI Artifact type — the single
 * source of truth for every surface. It accepts both a tool result's
 * `output.artifact` (live turns) and a persisted artifact row from the store
 * (`artifactId`/`_id`, on reload), so the inline cards and the Files panel can
 * never disagree about what's an artifact. Validity is by `kind` only: there is
 * deliberately NO per-format whitelist, so a new backend format shows up
 * everywhere without a matching frontend edit.
 */
export const normalizeArtifact = (raw: unknown): Artifact | null => {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  const id = String(a.id ?? a.artifactId ?? a._id ?? '');
  if (!id) return null;

  if (a.kind === 'chart') {
    const spec = a.spec as ChartSpec | undefined;
    if (!spec || typeof spec !== 'object') return null;
    return {
      id,
      kind: 'chart',
      title: String(a.title ?? spec.title ?? 'Chart'),
      spec,
    };
  }

  if (a.kind === 'document') {
    return {
      id,
      kind: 'document',
      format: String(a.format ?? ''),
      title: String(a.title ?? 'Document'),
      fileName: String(a.fileName ?? 'document'),
      mimeType: String(a.mimeType ?? ''),
      fileKey: String(a.fileKey ?? ''),
      inline: Boolean(a.inline),
      size: typeof a.size === 'number' ? a.size : undefined,
    };
  }

  return null;
};
