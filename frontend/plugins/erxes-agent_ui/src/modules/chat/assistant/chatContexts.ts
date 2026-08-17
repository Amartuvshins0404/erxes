import { createContext } from 'react';
import type { ChatAttachment } from '~/modules/chat/types';
import type { Artifact } from '~/modules/chat/lib/artifacts';

// Per-message extras that don't ride the assistant-ui message model: persisted
// artifacts (charts/documents, re-linked by native id), artifact-tool failures,
// and the persisted pair id used for message deletion. Computed in ChatPage from
// the raw AgentUIMessages, keyed by UIMessage id (assistant-ui preserves ids).
export interface MessageExtras {
  artifacts?: Artifact[];
  failures?: { toolName: string; toolCallId?: string; errorText?: string }[];
  persistedMessageId?: string;
  // The message is the live one of an in-flight turn (drives avatar pulse,
  // streaming width, and suppresses settled-only chrome).
  streaming?: boolean;
}

// Actions the message rows dispatch up to the page: regenerate the last reply,
// delete a persisted prompt+reply pair, resend a past user message, and copy a
// past user message into the composer for editing.
export interface ChatMessageActions {
  onRegenerate: () => void;
  onDeleteMessage: (uiMessageId: string, persistedMessageId: string) => void;
  onResendMessage: (text: string, attachments: ChatAttachment[]) => void;
}

export const MessageExtrasContext = createContext<Map<string, MessageExtras>>(
  new Map(),
);

export const ChatMessageActionsContext = createContext<ChatMessageActions>({
  onRegenerate: () => undefined,
  onDeleteMessage: () => undefined,
  onResendMessage: () => undefined,
});

// The erxes-only metadata blob the AI SDK UIMessage carries; assistant-ui
// passes message.metadata through conversion untouched.
export const agentMeta = <T,>(metadata: unknown): T =>
  (metadata ?? {}) as T;

// Focus the agent composer's textarea (caret to the end) — used after loading
// a suggestion or a past message into the composer.
export const focusAgentComposer = () => {
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLTextAreaElement>(
      '[data-agent-composer] textarea',
    );
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  });
};
