import { REACT_APP_API_URL } from 'erxes-ui';
import type { AgentUIMessage } from '~/modules/chat/types';
import type { ArtifactGroup } from '~/modules/chat/hooks/useThreadArtifacts';
import { messageText, type ToolPartView } from '~/modules/chat/lib/uiParts';
import {
  normalizeArtifact,
  type Artifact,
  type DocumentArtifact,
} from '~/modules/chat/lib/artifactNormalize';

// The artifact contract + normalizer live in ./artifactNormalize (pure and
// unit-tested). This module adds the chat-side readers (tool output, message
// association) and the download URL. Re-export the contract so existing call
// sites keep importing it from here.
export { normalizeArtifact } from '~/modules/chat/lib/artifactNormalize';
export type {
  Artifact,
  ChartArtifact,
  DocumentArtifact,
  DocumentFormat,
} from '~/modules/chat/lib/artifactNormalize';

/** Pull a valid artifact off a tool result, or null when there isn't one. */
export const asArtifact = (output: unknown): Artifact | null =>
  normalizeArtifact((output as { artifact?: unknown })?.artifact);

/** The artifact carried by a tool part's output (settled tool calls only). */
export const asArtifactPart = (call: ToolPartView): Artifact | null => {
  if (call.isError || call.state !== 'output-available') return null;
  return asArtifact(call.output);
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

  const unlinked = groups.filter((g) => !g.linked && g.prompt);
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

/** A URL the browser can open/download for a document artifact. */
export const documentUrl = (artifact: DocumentArtifact): string => {
  const { fileKey, fileName } = artifact;
  if (artifact.inline || /^(https?:|data:)/i.test(fileKey)) return fileKey;
  return `${REACT_APP_API_URL}/read-file?key=${encodeURIComponent(
    fileKey,
  )}&inline=true&name=${encodeURIComponent(fileName)}`;
};
