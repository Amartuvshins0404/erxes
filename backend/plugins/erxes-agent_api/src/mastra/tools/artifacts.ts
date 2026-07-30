import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { chartSpecSchema } from '~/mastra/charts/chartSpec';

// ---------------------------------------------------------------------------
// Artifact — the structured, previewable result a tool returns in its output.
//
// The chat UI detects `output.artifact` on a tool result, shows an inline
// ArtifactCard, and renders it in the Preview panel (chart → interactive
// ECharts; document → inline PDF or a download card). Artifacts ride the normal
// tool-result stream, so they persist and rehydrate with the message for free.
//
// Keep this contract in sync with the frontend reader at
// frontend/plugins/erxes-agent_ui/src/modules/chat/lib/artifacts.ts
// ---------------------------------------------------------------------------

export const DOCUMENT_FORMATS = ['pdf', 'docx', 'xlsx', 'pptx'] as const;
export type DocumentFormat = (typeof DOCUMENT_FORMATS)[number];

export const MIME_BY_FORMAT: Record<DocumentFormat, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export const chartArtifactSchema = z.object({
  id: z.string(),
  kind: z.literal('chart'),
  title: z.string(),
  spec: chartSpecSchema,
});

export const documentArtifactSchema = z.object({
  id: z.string(),
  kind: z.literal('document'),
  format: z.enum(DOCUMENT_FORMATS),
  title: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  // Storage key (read back through core's /read-file) OR a full/data URL when
  // the instance can't persist (e.g. local-disk storage).
  fileKey: z.string(),
  // True when fileKey is an inline data: URL rather than a storage key.
  inline: z.boolean().optional(),
  size: z.number().optional(),
});

export const artifactSchema = z.discriminatedUnion('kind', [
  chartArtifactSchema,
  documentArtifactSchema,
]);

export type ChartArtifact = z.infer<typeof chartArtifactSchema>;
export type DocumentArtifact = z.infer<typeof documentArtifactSchema>;
export type Artifact = z.infer<typeof artifactSchema>;

/** Short, collision-free artifact id (e.g. "chart_ab12cd"). */
export function newArtifactId(prefix: 'chart' | 'doc'): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}
