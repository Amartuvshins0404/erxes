import { IModels } from '~/connectionResolvers';
import {
  getThreadTitle,
  getNativeMemory,
  ensureThreadRegistered,
  patchNativeMessages,
  createNativeAssistantMessage,
} from '@/session/nativeStore';
import { IMastraChatAttachment } from '@/session/@types/session';
import { MemoryBinding, PreparedTurn } from '@/agent/types';

export async function persistTurn(params: {
  models: IModels;
  prepared: PreparedTurn;
  reply: string | null;
  assistantMessageId?: string;
  // Replace native intermediate text blocks with the guarded final reply.
  replaceNativeText?: boolean;
  interrupted?: boolean;
  // The model stream failed outright — native persistence definitely skipped
  // this turn, so a reply row must be created, not just patched.
  failed?: boolean;
  hasArtifacts?: boolean;
}): Promise<{
  titlePromise: Promise<string | null>;
  assistantMessageId: string | null;
}> {
  const {
    prepared,
    reply,
    assistantMessageId,
    interrupted,
    failed,
    hasArtifacts,
    replaceNativeText,
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
        agentId: agentConfig._id,
        reply,
        attachments,
        assistantMessageId,
        turnStartedAt: prepared.authCtx?.turnStartedAt,
        interrupted,
        failed,
        replaceNativeText,
      });
    } catch (e) {
      console.warn(
        `[native-chat-store] turn reconcile skipped: ${
          (e as Error)?.message || e
        }`,
      );
    }
  }

  // Link only turns that actually persisted artifacts. Ordinary chat turns
  // otherwise issued an unproductive updateMany against the artifact store.
  const turnId = prepared.authCtx?.turnId;
  if (hasArtifacts) {
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
      console.warn(
        '[artifact-store] turn→message link skipped: no assistant message id recovered',
      );
    }
  }

  return { titlePromise, assistantMessageId: nativeAssistantId };
}

interface NativeChatMessage {
  id: string;
  role: string;
  createdAt?: Date | string;
  content?: { metadata?: Record<string, unknown> } & Record<string, unknown>;
}

// Recovery guard for the "most recent row" fallbacks below: only rows written
// at/after the turn started (minus clock-skew slack) can be THIS turn's rows.
// Without the guard, a recall that runs before Mastra finishes persisting the
// new assistant row silently returns the PREVIOUS turn's — and the turn's
// artifacts get linked to the wrong message (their inline cards then re-render
// under no bubble at all).
const RECOVERY_SKEW_MS = 5_000;
// One short retry for when the row is simply still mid-write at recall time.
const RECOVERY_RETRY_DELAY_MS = 500;

const isFromTurn = (m: NativeChatMessage, turnStartedAt?: Date): boolean => {
  if (!turnStartedAt) return true;
  const at = m.createdAt ? new Date(m.createdAt).getTime() : NaN;
  // A row with no readable timestamp can't be verified — treat it as stale
  // rather than risk a mislink (unlinked degrades gracefully, mislinked not).
  return (
    Number.isFinite(at) && at >= turnStartedAt.getTime() - RECOVERY_SKEW_MS
  );
};

function replaceNativeAssistantText(
  content: NativeChatMessage['content'],
  reply: string,
): Record<string, unknown> {
  const base = (content ?? {}) as Record<string, unknown>;
  const parts = Array.isArray(base.parts) ? base.parts : [];
  return {
    ...base,
    content: reply,
    parts: [
      ...parts.filter(
        (part) =>
          !part ||
          typeof part !== 'object' ||
          (part as { type?: unknown }).type !== 'text',
      ),
      { type: 'text', text: reply },
    ],
  };
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
  assistantMessageId?: string;
  turnStartedAt?: Date;
  interrupted?: boolean;
  failed?: boolean;
  replaceNativeText?: boolean;
}): Promise<string | null> {
  const { subdomain, binding, agentId, reply, attachments } = params;
  const { assistantMessageId, interrupted, failed, replaceNativeText } = params;
  const { turnStartedAt } = params;

  // A stopped turn keeps its state so a reload shows the "stopped" badge
  // instead of treating the partial reply as complete.
  const assistantMeta: Record<string, unknown> = {};
  if (interrupted) assistantMeta.interrupted = true;

  await ensureThreadRegistered(
    subdomain,
    binding.thread,
    binding.resource,
    agentId,
  );

  const wantUser = Boolean(attachments?.length);
  const wantAssistant =
    Object.keys(assistantMeta).length > 0 ||
    Boolean(replaceNativeText && reply);

  if (!wantUser && !wantAssistant && (assistantMessageId || !reply)) {
    return assistantMessageId ?? null;
  }

  const memory = await getNativeMemory(subdomain);
  const recallRecent = async (): Promise<NativeChatMessage[]> => {
    const recalled = (await memory.recall({
      threadId: binding.thread,
      resourceId: binding.resource,
      perPage: 4,
      page: 0,
      orderBy: { field: 'createdAt', direction: 'DESC' },
    })) as { messages?: NativeChatMessage[] };
    return recalled?.messages ?? [];
  };
  let recent = await recallRecent();

  // THIS turn's assistant row: by id when the stream carried one, else the most
  // recent assistant row THAT WAS WRITTEN DURING THIS TURN. Better to recover
  // nothing (artifacts stay unlinked; the client's prompt matcher re-attaches
  // them) than the previous turn's id (a permanent mislink).
  const findAssistant = (): NativeChatMessage | undefined =>
    assistantMessageId
      ? recent.find((m) => m.id === assistantMessageId)
      : recent.find(
          (m) => m.role === 'assistant' && isFromTurn(m, turnStartedAt),
        );

  let assistantMsg = findAssistant();
  const needAssistant = wantAssistant || (!assistantMessageId && !!reply);
  if (!assistantMsg && needAssistant) {
    // The row is usually just mid-write when the first recall runs.
    await new Promise((resolve) =>
      setTimeout(resolve, RECOVERY_RETRY_DELAY_MS),
    );
    recent = await recallRecent();
    assistantMsg = findAssistant();
  }

  // Patch via the STORAGE domain (patchNativeMessages), not Memory.updateMessages:
  // for a metadata-only patch the store write is a plain Mongo update
  // (content.content is unchanged), and best-effort — a write hiccup never loses
  // the rest of the turn's work.
  if (wantUser) {
    const userMsg = recent.find(
      (m) => m.role === 'user' && isFromTurn(m, turnStartedAt),
    );
    if (userMsg) {
      await patchNativeMessages(subdomain, [
        {
          id: userMsg.id,
          content: mergeErxesMeta(userMsg.content, { attachments }),
        },
      ]);
    }
  }

  // Error/abort finishes skip Mastra's native save entirely — no assistant row
  // will ever appear no matter how long we wait. When finalization still
  // produced a user-facing reply, create the row directly so the thread shows
  // the outcome instead of a bare question. (Successful turns always have the
  // native row; creating there would double-persist.)
  if (!assistantMsg && reply && (interrupted || failed)) {
    const createdId = await createNativeAssistantMessage({
      subdomain,
      threadId: binding.thread,
      resourceId: binding.resource,
      reply,
      metadata: assistantMeta,
    });
    return assistantMessageId ?? createdId;
  }

  if (wantAssistant && assistantMsg) {
    const content =
      replaceNativeText && reply
        ? replaceNativeAssistantText(assistantMsg.content, reply)
        : assistantMsg.content;
    await patchNativeMessages(subdomain, [
      {
        id: assistantMsg.id,
        content: mergeErxesMeta(content, assistantMeta),
      },
    ]);
  }

  return assistantMessageId ?? (reply ? assistantMsg?.id ?? null : null);
}
