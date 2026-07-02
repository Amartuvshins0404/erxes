import { IModels } from '~/connectionResolvers';
import {
  getThreadTitle,
  getNativeMemory,
  ensureThreadRegistered,
  patchNativeMessages,
} from '@/session/nativeStore';
import { IMastraChatAttachment } from '@/session/@types/session';
import { MemoryBinding, PreparedTurn } from '@/agent/types';

export async function persistTurn(params: {
  models: IModels;
  prepared: PreparedTurn;
  reply: string | null;
  // Per-reasoning-step short summaries, index-aligned to the assistant turn's
  // reasoning parts (holes are null). Stamped onto the assistant message's erxes
  // meta so the chat re-renders the short thoughts on reload.
  reasoningSummaries?: (string | null)[];
  // One-line "what this turn accomplished" headline for the collapsed trace.
  turnSummary?: string;
  assistantMessageId?: string;
  interrupted?: boolean;
}): Promise<{
  titlePromise: Promise<string | null>;
  assistantMessageId: string | null;
}> {
  const {
    prepared,
    reply,
    assistantMessageId,
    reasoningSummaries,
    turnSummary,
    interrupted,
  } = params;
  const { useMemory, memCtx, agentConfig, attachments } = prepared;

  const titlePromise: Promise<string | null> =
    reply && prepared.memoryBinding
      ? getThreadTitle(
          memCtx.subdomain,
          prepared.memoryBinding.thread,
          prepared.memoryBinding.resource,
        ).catch(() => null)
      : Promise.resolve<string | null>(null);

  let nativeAssistantId = assistantMessageId ?? null;
  if (useMemory && prepared.memoryBinding) {
    try {
      nativeAssistantId = await patchNativeTurn({
        subdomain: memCtx.subdomain,
        binding: prepared.memoryBinding,
        agentId: agentConfig.agentId,
        reply,
        attachments,
        reasoningSummaries,
        turnSummary,
        assistantMessageId,
        interrupted,
      });
    } catch (e) {
      console.warn(
        `[native-chat-store] turn reconcile skipped: ${(e as Error)?.message || e}`,
      );
    }
  }

  // Link this turn's generated artifacts to the assistant message so the chat
  // can re-render their inline cards on reload (the dedicated store survives,
  // unlike the native-store message meta). Best-effort.
  const turnId = prepared.authCtx?.turnId;
  if (nativeAssistantId && turnId) {
    await params.models.MastraArtifact.linkTurnToMessage(
      turnId,
      nativeAssistantId,
    ).catch((e) =>
      console.warn(
        `[artifact-store] turn→message link skipped: ${
          (e as Error)?.message || e
        }`,
      ),
    );
  } else if (turnId) {
    // The turn produced artifacts (turnId stamped) but we never recovered the
    // assistant message id, so their inline cards can't be re-attached on reload.
    // Surface it — this is the one thing that silently breaks the card rehydration.
    console.warn(
      '[artifact-store] turn→message link skipped: no assistant message id recovered',
    );
  }

  return { titlePromise, assistantMessageId: nativeAssistantId };
}

interface NativeChatMessage {
  id: string;
  role: string;
  content?: { metadata?: Record<string, unknown> } & Record<string, unknown>;
}

function mergeErxesMeta(
  content: NativeChatMessage['content'],
  erxes: Record<string, unknown>,
): Record<string, unknown> {
  const base = (content ?? {}) as Record<string, unknown>;
  const metadata = (base.metadata ?? {}) as Record<string, unknown>;
  const prevErxes = (metadata.erxes ?? {}) as Record<string, unknown>;
  return {
    ...base,
    metadata: { ...metadata, erxes: { ...prevErxes, ...erxes } },
  };
}

export async function patchNativeTurn(params: {
  subdomain: string;
  binding: MemoryBinding;
  agentId: string;
  reply: string | null;
  attachments?: IMastraChatAttachment[];
  reasoningSummaries?: (string | null)[];
  turnSummary?: string;
  assistantMessageId?: string;
  interrupted?: boolean;
}): Promise<string | null> {
  const { subdomain, binding, agentId, reply, attachments } = params;
  const { reasoningSummaries, turnSummary, assistantMessageId, interrupted } =
    params;

  // The erxes-meta fields to stamp onto the assistant message (only the present
  // ones), so a reload re-renders the short thoughts + turn headline. A stopped
  // turn also stamps `interrupted` so a reload shows the "stopped" badge instead
  // of the partial reply as complete.
  const assistantMeta: Record<string, unknown> = {};
  if (reasoningSummaries?.length)
    assistantMeta.reasoningSummaries = reasoningSummaries;
  if (turnSummary) assistantMeta.turnSummary = turnSummary;
  if (interrupted) assistantMeta.interrupted = true;

  await ensureThreadRegistered(
    subdomain,
    binding.thread,
    binding.resource,
    agentId,
  );

  const wantUser = Boolean(attachments?.length);
  const wantAssistant = Object.keys(assistantMeta).length > 0;

  if (!wantUser && !wantAssistant && (assistantMessageId || !reply)) {
    return assistantMessageId ?? null;
  }

  const memory = await getNativeMemory(subdomain);
  const recalled = (await memory.recall({
    threadId: binding.thread,
    resourceId: binding.resource,
    perPage: 4,
    page: 0,
    orderBy: { field: 'createdAt', direction: 'DESC' },
  })) as { messages?: NativeChatMessage[] };
  const recent = recalled?.messages ?? [];

  // Patch via the STORAGE domain (patchNativeMessages), not Memory.updateMessages:
  // the latter re-embeds the message and rewrites its Qdrant vectors whenever
  // semantic recall is on (always, here). For a metadata-only patch that is pure
  // waste (content.content is unchanged) and fragile — a single embed/Qdrant
  // hiccup throws and loses the patch. patchNativeMessages is a plain Mongo
  // write: no embeddings, no vector I/O, and best-effort.
  if (wantUser) {
    const userMsg = recent.find((m) => m.role === 'user');
    if (userMsg) {
      await patchNativeMessages(subdomain, [
        {
          id: userMsg.id,
          content: mergeErxesMeta(userMsg.content, { attachments }),
        },
      ]);
    }
  }

  if (wantAssistant) {
    // The just-saved assistant row (by id when known, else the most recent).
    const assistantMsg = assistantMessageId
      ? recent.find((m) => m.id === assistantMessageId)
      : recent.find((m) => m.role === 'assistant');
    if (assistantMsg) {
      await patchNativeMessages(subdomain, [
        {
          id: assistantMsg.id,
          content: mergeErxesMeta(assistantMsg.content, assistantMeta),
        },
      ]);
    }
  }

  return (
    assistantMessageId ??
    (reply ? recent.find((m) => m.role === 'assistant')?.id ?? null : null)
  );
}
