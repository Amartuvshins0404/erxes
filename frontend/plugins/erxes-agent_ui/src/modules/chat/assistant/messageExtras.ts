import type { AgentUIMessage } from '~/modules/chat/types';
import {
  artifactOutcomes,
  mergeArtifacts,
  type Artifact,
} from '~/modules/chat/lib/artifacts';
import type { MessageExtras } from '~/modules/chat/assistant/chatContexts';

// Builds the per-message extras the assistant-ui rows consume: streaming flag,
// the persisted prompt+reply pair id (carried on the assistant message, shown
// on the user prompt), and merged live+store artifact outcomes. Mirrors the
// merge/rescue rules the old bubble applied per message.
export function buildMessageExtras(
  messages: AgentUIMessage[],
  chatLoading: boolean,
  storeArtifactsByMessage: Map<string, Artifact[]>,
): Map<string, MessageExtras> {
  const visible = messages.filter(
    (m) => !(m.role === 'user' && m.metadata?.hidden),
  );
  const map = new Map<string, MessageExtras>();

  visible.forEach((msg, i) => {
    const streaming = msg.role === 'assistant' && i === visible.length - 1 && chatLoading;
    const extras: MessageExtras = {
      streaming,
      persistedMessageId:
        msg.metadata?.messageId ??
        (visible[i + 1]?.role === 'assistant'
          ? visible[i + 1].metadata?.messageId
          : undefined),
    };

    if (msg.role === 'assistant') {
      const { artifacts: liveArtifacts, failures: failedArtifactTools } =
        artifactOutcomes(msg.parts, !streaming);
      const storeArtifacts = msg.metadata?.messageId
        ? storeArtifactsByMessage.get(msg.metadata.messageId)
        : undefined;
      const artifacts = mergeArtifacts(liveArtifacts, storeArtifacts);
      // A tool that finished without an artifact on it may be exactly what a
      // merged store row just rescued — don't show a failure card next to the
      // rescued artifact. Genuine errors always show.
      const rescuedCount = artifacts.length - liveArtifacts.length;
      const visibleFailures = failedArtifactTools
        .filter((tool) => tool.isError)
        .concat(
          failedArtifactTools.filter((tool) => !tool.isError).slice(rescuedCount),
        );
      extras.artifacts = artifacts;
      extras.failures = visibleFailures.map((tool) => ({
        toolName: tool.toolName,
        toolCallId: tool.toolCallId,
        errorText:
          tool.errorText ||
          (tool.output as { message?: string } | undefined)?.message,
      }));
    }

    map.set(msg.id, extras);
  });

  return map;
}
