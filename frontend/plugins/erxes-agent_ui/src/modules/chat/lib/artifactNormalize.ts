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
  // Per-slide image refs for pptx decks (ordered). Each entry follows the SAME
  // convention as fileKey: a storage key OR an inline data:/http URL — resolve
  // with resolveStorageRef, exactly like documentUrl resolves fileKey.
  slides?: string[];
  slideCount?: number;
}

export interface DiagramArtifact {
  id: string;
  kind: 'diagram';
  title: string;
  definition: string;
}

export type Artifact = ChartArtifact | DocumentArtifact | DiagramArtifact;

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

  if (a.kind === 'diagram') {
    return {
      id,
      kind: 'diagram',
      title: String(a.title ?? 'Diagram'),
      definition: String(a.definition ?? ''),
    };
  }

  if (a.kind === 'document') {
    const slides = Array.isArray(a.slides)
      ? a.slides.filter((s): s is string => typeof s === 'string')
      : undefined;
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
      slides: slides && slides.length ? slides : undefined,
      slideCount: typeof a.slideCount === 'number' ? a.slideCount : undefined,
    };
  }

  return null;
};

/**
 * Resolve a storage ref to a browser URL — the single rule shared by documentUrl
 * (for fileKey) and the pptx slide deck (for each `slides` entry). A data:/http
 * ref is returned as-is; anything else is treated as a storage key and read
 * through core's /read-file. Pure (base passed in) so it is unit-testable.
 */
export const resolveStorageRef = (
  ref: string,
  apiUrl: string,
  fileName?: string,
): string => {
  if (/^(https?:|data:)/i.test(ref)) return ref;
  const name = fileName ? `&name=${encodeURIComponent(fileName)}` : '';
  return `${apiUrl}/read-file?key=${encodeURIComponent(ref)}&inline=true${name}`;
};
