import { useContext } from 'react';
import {
  MessagePrimitive,
  useComposerRuntime,
  useMessage,
} from '@assistant-ui/react';
import type { ToolCallMessagePartProps } from '@assistant-ui/react';
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown';
import {
  IconAlertTriangle,
  IconCheck,
  IconLoader2,
  IconPencil,
  IconRefresh,
  IconRepeat,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'erxes-ui';
import type { AgentMessageMetadata } from '~/modules/chat/types';
import {
  agentMeta,
  ChatMessageActionsContext,
  focusAgentComposer,
  MessageExtrasContext,
} from '~/modules/chat/assistant/chatContexts';
import { AgentAvatar } from '~/modules/chat/components/Avatars';
import {
  ArtifactCard,
  ArtifactFailureCard,
} from '~/modules/chat/components/ArtifactCard';
import { CopyButton } from '~/modules/chat/components/CopyButton';
import { MessageAttachments } from '~/modules/chat/components/MessageAttachments';

const formatTime = (iso?: string): string =>
  (iso ? new Date(iso) : new Date()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

// One icon-only message action (Edit, Resend, Regenerate, Delete).
const MessageAction = ({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <Tooltip.Provider>
    <Tooltip>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          className="size-6 flex items-center justify-center rounded text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground disabled:opacity-40 dark:hover:bg-white/10"
        >
          {icon}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  </Tooltip.Provider>
);

// camelCase / plugin-prefixed operation names → plain words ("deals" stays,
// "posOrdersSummary" → "pos orders summary"). Tool machinery stays one quiet
// status line per call — the readable answer carries the content.
const humanizeToolName = (name: string): string =>
  name
    .replace(/^tool[-_]/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase();

// One quiet inline status line per tool call — replaces the old summarized
// "Working… / Using X…" activity line with per-call truth.
const ToolStatus = ({ toolName, result, isError }: ToolCallMessagePartProps) => {
  const done = result !== undefined;
  return (
    <div className="flex items-center gap-1.5 py-0.5 text-xs text-muted-foreground">
      {isError ? (
        <IconX className="size-3.5 text-destructive" />
      ) : done ? (
        <IconCheck className="size-3.5 text-primary" />
      ) : (
        <IconLoader2 className="size-3.5 animate-spin" />
      )}
      <span>{humanizeToolName(toolName)}</span>
    </div>
  );
};

// Text parts render through assistant-ui's streaming markdown (reads the part
// from the scoped message-part context).
const MarkdownText = () => (
  <div className="ea-md">
    <MarkdownTextPrimitive />
  </div>
);

const messageText = (s: {
  content: readonly { type: string; text?: string }[];
}): string =>
  s.content
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');

const UserMessageRow = () => {
  const { t } = useTranslation('mastra');
  const actions = useContext(ChatMessageActionsContext);
  const composerRuntime = useComposerRuntime();
  const id = useMessage((s) => s.id);
  const metadata = useMessage((s) =>
    agentMeta<AgentMessageMetadata>(s.metadata),
  );
  const text = useMessage(messageText);
  const extras = useContext(MessageExtrasContext);
  const persistedMessageId = extras.get(id)?.persistedMessageId;

  // Approve/deny replies continue a gated turn without a visible user bubble.
  if (metadata.hidden) return null;

  const attachments = metadata.attachments;
  const time = formatTime(metadata.createdAt);
  const hasText = !!text.trim();

  // Load this message back into the composer to tweak before sending.
  const editIntoComposer = () => {
    composerRuntime.setText(text);
    focusAgentComposer();
  };

  return (
    <div className="flex flex-col items-end gap-1 group ea-msg-in">
      {attachments && attachments.length > 0 && (
        <MessageAttachments attachments={attachments} />
      )}
      {hasText ? (
        <div className="ea-user-bubble text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm">
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {text}
          </p>
          <p className="text-[10px] mt-1 text-primary-foreground/60">{time}</p>
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground pr-1">{time}</p>
      )}
      {(hasText || persistedMessageId) && (
        <div className="flex items-center gap-0.5 pr-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasText && (
            <>
              <MessageAction
                icon={<IconPencil className="size-3.5" />}
                label="Edit message"
                onClick={editIntoComposer}
              />
              <MessageAction
                icon={<IconRepeat className="size-3.5" />}
                label="Resend message"
                onClick={() => actions.onResendMessage(text, attachments ?? [])}
              />
              <CopyButton text={text} />
            </>
          )}
          {persistedMessageId && (
            <MessageAction
              icon={<IconTrash className="size-3.5" />}
              label={t('delete-prompt-and-reply')}
              onClick={() => actions.onDeleteMessage(id, persistedMessageId)}
            />
          )}
        </div>
      )}
    </div>
  );
};

const AssistantMessageRow = () => {
  const actions = useContext(ChatMessageActionsContext);
  const id = useMessage((s) => s.id);
  const metadata = useMessage((s) =>
    agentMeta<AgentMessageMetadata>(s.metadata),
  );
  const text = useMessage(messageText);
  const extras = useContext(MessageExtrasContext).get(id);
  const streaming = !!extras?.streaming;
  const artifacts = extras?.artifacts ?? [];
  const failures = extras?.failures ?? [];

  return (
    <div className="flex justify-start items-start gap-3 group ea-msg-in">
      <AgentAvatar live={streaming} />
      <div
        className={`min-w-0 px-1 py-1 ${
          streaming || artifacts.length > 0 ? 'w-full' : 'w-auto max-w-full'
        }`}
      >
        <MessagePrimitive.Parts
          components={{
            Text: MarkdownText,
            tools: { Fallback: ToolStatus },
          }}
        />
        {artifacts.length > 0 && (
          <div className="mt-1">
            {artifacts.map((artifact, i) => (
              <ArtifactCard
                key={artifact.id || `artifact-${i}`}
                artifact={artifact}
                live={streaming}
              />
            ))}
          </div>
        )}
        {failures.length > 0 && (
          <div className="mt-1">
            {failures.map((tool, i) => (
              <ArtifactFailureCard
                key={tool.toolCallId || `failed-${i}`}
                toolName={tool.toolName}
                errorText={tool.errorText}
              />
            ))}
          </div>
        )}
        {!streaming && (
          <div className="flex items-center justify-between gap-2 mt-1.5">
            <p className="text-[10px] text-muted-foreground">
              {formatTime(metadata.createdAt)}
              {metadata.interrupted && (
                <span className="ml-1.5 text-amber-600 dark:text-amber-500">
                  · stopped
                </span>
              )}
            </p>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <MessagePrimitive.If last>
                <MessageAction
                  icon={<IconRefresh className="size-3.5" />}
                  label="Regenerate"
                  onClick={actions.onRegenerate}
                />
              </MessagePrimitive.If>
              <CopyButton text={text} />
            </div>
          </div>
        )}
        {/* A settled turn with no answer text and no artifact must never read
            as a blank bubble — surface the outcome and offer a retry. */}
        {!streaming &&
          !text.trim() &&
          artifacts.length === 0 &&
          failures.length === 0 && (
            <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
              <IconAlertTriangle className="size-3.5 shrink-0 text-amber-600 dark:text-amber-500" />
              <span>
                {metadata.interrupted
                  ? 'This response was interrupted before it finished.'
                  : 'No response was generated for this message.'}
              </span>
              <MessagePrimitive.If last>
                <button
                  type="button"
                  onClick={actions.onRegenerate}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <IconRefresh className="size-3" />
                  Retry
                </button>
              </MessagePrimitive.If>
            </div>
          )}
      </div>
    </div>
  );
};

export const AgentMessage = () => {
  const role = useMessage((s) => s.role);
  if (role === 'user') return <UserMessageRow />;
  if (role === 'assistant') return <AssistantMessageRow />;
  return null;
};
