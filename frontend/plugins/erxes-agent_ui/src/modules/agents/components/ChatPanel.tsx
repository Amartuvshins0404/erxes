import { IconAlertCircle, IconX } from '@tabler/icons-react';
import { Button } from 'erxes-ui';

import { CALM_FACE_CYCLE } from '../botCycles';
import { useAgentsConnection } from '../hooks/useAgentsConnection';
import { useAgentsModels } from '../hooks/useAgentsModels';
import type { IUseAgentsChatResult } from '../hooks/useAgentsChat';
import { BloubBot } from './BloubBot';
import { Composer } from './Composer';
import { modelSelectionValue, ModelPicker } from './ModelPicker';
import { MessageList } from './MessageList';
import { ThinkingPicker } from './ThinkingPicker';

/** Starter prompts offered on the empty state. */
const SUGGESTIONS = [
  'Summarize my open deals',
  'Draft a follow-up email',
  'Show overdue tasks',
  'Search my contacts',
];

/** Extracts a readable message from a transport error (JSON or plain). */
const describeError = (error: Error): string => {
  try {
    const parsed = JSON.parse(error.message) as { error?: string };
    if (typeof parsed.error === 'string' && parsed.error) {
      return parsed.error;
    }
  } catch {
    // Not a JSON body; use the raw message.
  }

  return error.message || 'Something went wrong.';
};

export interface IChatPanelProps {
  chat: IUseAgentsChatResult;
  /** Optional class for the panel root. */
  className?: string;
}

/**
 * Complete agents chat surface: transcript, approval prompts, composer, and
 * error feedback. The owning page or widget holds the `useAgentsChat` hook
 * so it can also drive thread controls from the same instance.
 *
 * Two layouts share one composer:
 * - empty state: hero (animated bot + starters) and the composer centered
 *   together as a single block, so a fresh conversation reads as one focal
 *   point instead of a floating hero with a docked bar;
 * - conversation: transcript fills the panel with the composer docked below.
 *
 * Key management lives exclusively in the plugin settings; this panel never
 * gates chatting on connection state — the connections query is display-only,
 * feeding the model picker's Auto label with the actual default model.
 */
export const ChatPanel = ({ chat, className }: IChatPanelProps) => {
  const {
    messages,
    status,
    error,
    loadingThread,
    sendMessage,
    addToolApprovalResponse,
    stop,
    clearError,
    answerBusy,
    submitAnswer,
  } = chat;

  const { connections } = useAgentsConnection();
  const models = useAgentsModels();

  // The server default (Auto) runs the first configured provider's stored
  // model; showing it keeps the default from being hidden.
  const autoModel = connections[0]?.model;

  const isStreaming = status === 'submitted' || status === 'streaming';
  const isEmpty = messages.length === 0 && !loadingThread;

  const errorBanner = error ? (
    <div className="flex items-start gap-2 border-b border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <IconAlertCircle className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 flex-1 break-words">{describeError(error)}</p>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 shrink-0"
        onClick={clearError}
        aria-label="Dismiss error"
      >
        <IconX className="size-3.5" />
      </Button>
    </div>
  ) : null;

  const pickers = (
    <>
      <ModelPicker
        models={models}
        value={modelSelectionValue(chat.modelProvider, chat.modelId)}
        autoModel={autoModel}
        onChange={(value) => {
          if (!value) {
            chat.selectModel('', '');
            return;
          }

          const separatorIndex = value.indexOf('|');

          if (separatorIndex === -1) {
            return;
          }

          chat.selectModel(
            value.slice(0, separatorIndex),
            value.slice(separatorIndex + 1),
          );
        }}
      />
      <ThinkingPicker
        value={chat.thinkingLevel}
        onChange={chat.selectThinkingLevel}
      />
    </>
  );

  const composer = (
    <Composer
      status={status}
      disabled={loadingThread}
      onSend={(text) => sendMessage({ text })}
      onStop={stop}
      pickers={pickers}
    />
  );

  if (isEmpty) {
    return (
      <div className={`flex h-full min-h-0 flex-col ${className ?? ''}`}>
        {errorBanner}
        {/* Scroll-safe centering: centers when there is room, scrolls when the
            container is short (narrow side panel, mobile, split screens). */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <BloubBot size={104} cycle={CALM_FACE_CYCLE} />
              <div className="space-y-1">
                <h2 className="text-lg font-semibold md:text-xl">
                  How can I help you today?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ask anything about your erxes workspace
                </p>
              </div>
            </div>
            <div className="w-full">{composer}</div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage({ text: suggestion })}
                  className="rounded-full border bg-card px-3 py-1.5 text-[13px] text-muted-foreground shadow-sm transition-colors hover:border-foreground/20 hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full min-h-0 flex-col ${className ?? ''}`}>
      {errorBanner}
      <MessageList
        messages={messages}
        status={status}
        loadingThread={loadingThread}
        approvalBusy={isStreaming}
        onApprovalRespond={({ approvalId, approved, reason }) =>
          addToolApprovalResponse({ id: approvalId, approved, reason })
        }
        answerBusy={answerBusy || isStreaming}
        onAnswer={submitAnswer}
      />
      <div className="bg-background/80 px-3 pb-3 pt-1 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl">{composer}</div>
      </div>
    </div>
  );
};
