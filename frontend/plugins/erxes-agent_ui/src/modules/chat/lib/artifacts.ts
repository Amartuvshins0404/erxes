import { REACT_APP_API_URL } from 'erxes-ui';
import {
  IconChartBar,
  IconFile,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypePpt,
  IconFileTypeXls,
  IconHierarchy,
  IconPhoto,
  IconWorldWww,
} from '@tabler/icons-react';
import type { AgentUIMessage } from '~/modules/chat/types';
import type { ArtifactGroup } from '~/modules/chat/hooks/useThreadArtifacts';
import {
  asToolPart,
  messageText,
  toolKind,
  type ToolPartView,
} from '~/modules/chat/lib/uiParts';
import {
  normalizeArtifact,
  resolveStorageRef,
  type Artifact,
  type DocumentArtifact,
  type ImageArtifact,
  type WebsiteArtifact,
} from '~/modules/chat/lib/artifactNormalize';

// The artifact contract + normalizer live in ./artifactNormalize (pure and
// unit-tested). This module adds the chat-side readers (tool output, message
// association) and the download URL. Re-export the contract so existing call
// sites keep importing it from here.
export { normalizeArtifact } from '~/modules/chat/lib/artifactNormalize';
export type {
  Artifact,
  ChartArtifact,
  DiagramArtifact,
  DocumentArtifact,
  DocumentFormat,
  ImageArtifact,
  WebsiteArtifact,
} from '~/modules/chat/lib/artifactNormalize';

/** Pull every valid artifact off a tool result, including terminal file batches. */
export const asArtifacts = (output: unknown): Artifact[] => {
  if (!output || typeof output !== 'object') return [];
  const result = output as { artifact?: unknown; artifacts?: unknown };
  const candidates = [
    result.artifact,
    ...(Array.isArray(result.artifacts) ? result.artifacts : []),
  ];
  const artifacts: Artifact[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const artifact = normalizeArtifact(candidate);
    if (artifact && !seen.has(artifact.id)) {
      seen.add(artifact.id);
      artifacts.push(artifact);
    }
  }
  return artifacts;
};

/** Pull the first valid artifact off a tool result, or null when absent. */
export const asArtifact = (output: unknown): Artifact | null =>
  asArtifacts(output)[0] ?? null;

/** The artifacts carried by a settled tool part. */
export const asArtifactPart = (call: ToolPartView): Artifact | null => {
  if (call.isError || call.state !== 'output-available') return null;
  return asArtifact(call.output);
};

const asArtifactParts = (call: ToolPartView): Artifact[] => {
  if (call.isError || call.state !== 'output-available') return [];
  return asArtifacts(call.output);
};

/**
 * One pass over an assistant message's parts → the artifact cards to render
 * plus the artifact-classified tools that finished WITHOUT producing one.
 * Failures matter here because artifact tools are hidden from the run trace
 * (a card is their surface) — an errored render-chart call would otherwise
 * leave the turn looking like nothing happened at all.
 *
 * `settled` = the message is done streaming. A settled message's artifact tool
 * still awaiting its output will never get one (the output chunk was lost —
 * e.g. the stream aborted mid-tool), so it counts as a failure too; while
 * streaming the same pending state is just "still running" and reports nothing.
 */
export const artifactOutcomes = (
  parts: AgentUIMessage['parts'],
  settled = false,
): { artifacts: Artifact[]; failures: ToolPartView[] } => {
  const artifacts: Artifact[] = [];
  const failures: ToolPartView[] = [];
  for (const part of parts) {
    const tool = asToolPart(part);
    if (!tool) continue;
    const partArtifacts = asArtifactParts(tool);
    if (partArtifacts.length) {
      artifacts.push(...partArtifacts);
    } else if (
      toolKind(tool.toolName) === 'artifact' &&
      (tool.state === 'output-available' ||
        tool.state === 'output-error' ||
        (settled && tool.pending))
    ) {
      failures.push(tool);
    }
  }
  return { artifacts, failures };
};

/**
 * The artifact cards a bubble renders: the live tool-part artifacts UNIONED
 * with the persisted store rows for the message, deduped by id (live first —
 * its spec is always current). Either source alone can have holes: a rehydrated
 * tool part may have lost its `output.artifact` (live miss), and a store row's
 * message link can fail (store miss) — merging lets each rescue the other
 * instead of the old either/or hiding the artifact entirely.
 */
export const mergeArtifacts = (
  live: Artifact[],
  store: Artifact[] | undefined,
): Artifact[] => {
  if (!store?.length) return live;
  const seen = new Set(live.map((a) => a.id));
  return [...live, ...store.filter((a) => !seen.has(a.id))];
};

/**
 * Per-assistant-message artifact map used to re-render the inline cards on reload
 * (live turns read their own tool parts; those are gone after a refresh).
 *
 * Linked groups — the backend stamped a `messageId` (persistTurn →
 * linkTurnToMessage) — come straight from `byMessageId`. Unlinked groups (rows
 * created before that link existed, or a turn whose assistant-id recovery failed)
 * are attached to the assistant bubble that answered their originating prompt,
 * matched by the user turn text + chat order. Conservative by design: an
 * unmatched or ambiguous group is left out of the inline view (it still appears
 * in the Files panel) rather than risk pinning it to the wrong message.
 */
export const associateArtifacts = (
  messages: AgentUIMessage[],
  byMessageId: Map<string, Artifact[]>,
  groups: ArtifactGroup[],
): Map<string, Artifact[]> => {
  // Clone so callers can't mutate the hook's memoized map.
  const result = new Map<string, Artifact[]>(
    [...byMessageId].map(([id, items]) => [id, [...items]]),
  );

  // Prompt/order matching covers groups with no backend link at all AND groups
  // whose stamped messageId matches no message in this thread (a failed or
  // stale id recovery) — a link to nowhere would otherwise hide the group from
  // the inline view entirely.
  const knownIds = new Set(
    messages.map((m) => m.metadata?.messageId).filter(Boolean),
  );
  const unlinked = groups.filter(
    (g) =>
      g.prompt && (!g.linked || !g.messageId || !knownIds.has(g.messageId)),
  );
  if (!unlinked.length) return result;

  // Each user turn paired with the id of the assistant bubble that answered it,
  // in chat order — the candidates an unlinked group can attach to.
  const answered: { text: string; assistantId: string; used: boolean }[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.role !== 'user') continue;
    const next = messages[i + 1];
    const assistantId =
      next?.role === 'assistant' ? next.metadata?.messageId : undefined;
    if (assistantId) {
      answered.push({ text: messageText(m), assistantId, used: false });
    }
  }

  const append = (id: string, items: Artifact[]) => {
    const list = result.get(id) ?? [];
    const seen = new Set(list.map((a) => a.id));
    for (const a of items) if (!seen.has(a.id)) list.push(a);
    result.set(id, list);
  };

  // The stored prompt is the user message truncated to 200 chars (see
  // prepareTurn). Consume matches in order so two identical prompts can't both
  // claim the same bubble.
  for (const group of unlinked) {
    const turn = answered.find(
      (t) => !t.used && t.text.slice(0, 200) === group.prompt,
    );
    if (!turn) continue;
    turn.used = true;
    append(turn.assistantId, group.items);
  }

  return result;
};

/** Canonical icon component for any artifact kind/format. */
export const artifactIcon = (a: Artifact) => {
  if (a.kind === 'chart') return IconChartBar;
  if (a.kind === 'diagram') return IconHierarchy;
  if (a.kind === 'image') return IconPhoto;
  if (a.kind === 'website') return IconWorldWww;
  if (a.format === 'pdf') return IconFileTypePdf;
  if (a.format === 'docx') return IconFileTypeDocx;
  if (a.format === 'pptx') return IconFileTypePpt;
  if (a.format === 'xlsx') return IconFileTypeXls;
  return IconFile;
};

/** A URL the browser can open/download for a file-backed artifact. */
export const documentUrl = (
  artifact: DocumentArtifact | ImageArtifact | WebsiteArtifact,
): string => {
  if (artifact.inline) return artifact.fileKey;
  return resolveStorageRef(
    artifact.fileKey,
    REACT_APP_API_URL,
    artifact.fileName,
  );
};

/** Capability URL for a website entry document served by the plugin route. */
export const websiteUrl = (artifact: WebsiteArtifact): string => {
  const entryPath = artifact.entryPath
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  return `${REACT_APP_API_URL}/pl:erxes-agent/websites/${encodeURIComponent(
    artifact.id,
  )}/${encodeURIComponent(artifact.previewToken)}/${entryPath}`;
};

/**
 * Browser URLs for a pptx deck's slide images, in order. Each ref resolves the
 * SAME way as documentUrl resolves fileKey (storage key → /read-file, data:/http
 * as-is). Empty when the artifact carries no slides.
 */
export const slideUrls = (artifact: DocumentArtifact): string[] =>
  (artifact.slides ?? []).map((ref) =>
    resolveStorageRef(ref, REACT_APP_API_URL),
  );
