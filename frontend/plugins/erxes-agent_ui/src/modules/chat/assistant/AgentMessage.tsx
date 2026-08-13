import { useContext } from 'react';
import {
  MessagePrimitive,
  useComposerRuntime,
  useMessage,
} from '@assistant-ui/react';
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown';
import {
  IconAlertTriangle,
  IconCopy,
  IconPencil,
  IconRefresh,
  IconRepeat,
  IconTrash,
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
import {
  ArtifactCard,
  ArtifactFailureCard,
} from '~/modules/chat/components/ArtifactCard';
import { MessageAttachments } from '~/modules/chat/components/MessageAttachments';
import { ToolFallback } from '~/modules/chat/assistant/ToolFallback';
import { ToolGroupBlock } from '~/modules/chat/assistant/ToolGroupBlock';
import {
  ReasoningGroup,
  ReasoningPart,
} from '~/modules/chat/assistant/ReasoningBlock';
import { WebSearchTool } from '~/modules/chat/assistant/WebSearchTool';

// 32px quiet icon button, background-only hover — the clone's action control.
const actionClass =
  'flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-black/[0.07] hover:text-foreground dark:hover:bg-white/15';

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
          className={`${actionClass} disabled:opacity-40`}
        >
          {icon}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  </Tooltip.Provider>
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
  const hasText = !!text.trim();

  // Load this message back into the composer to tweak before sending.
  const editIntoComposer = () => {
    composerRuntime.setText(text);
    focusAgentComposer();
  };

  return (
    <MessagePrimitive.Root className="mx-auto flex w-full max-w-3xl flex-col items-end gap-1 group ea-msg-in">
      {attachments && attachments.length > 0 && (
        <MessageAttachments attachments={attachments} />
      )}
      {hasText && (
        <div className="max-w-[70%] rounded-[22px] bg-[#0d0d0d] px-4 py-2.5 leading-6 text-white dark:bg-[#ececec] dark:text-[#0d0d0d]">
          <p className="text-[15px] whitespace-pre-wrap break-words">{text}</p>
        </div>
      )}
      {(hasText || persistedMessageId) && (
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {hasText && (
            <>
              <MessageAction
                icon={<IconCopy className="size-4" />}
                label="Copy"
                onClick={() => void navigator.clipboard?.writeText(text)}
              />
              <MessageAction
                icon={<IconPencil className="size-4" />}
                label="Edit message"
                onClick={editIntoComposer}
              />
              <MessageAction
                icon={<IconRepeat className="size-4" />}
                label="Resend message"
                onClick={() => actions.onResendMessage(text, attachments ?? [])}
              />
            </>
          )}
          {persistedMessageId && (
            <MessageAction
              icon={<IconTrash className="size-4" />}
              label={t('delete-prompt-and-reply')}
              onClick={() => actions.onDeleteMessage(id, persistedMessageId)}
            />
          )}
        </div>
      )}
    </MessagePrimitive.Root>
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
    <MessagePrimitive.Root className="mx-auto flex w-full max-w-3xl flex-col group ea-msg-in">
      <div className="text-[15px] leading-7">
        <MessagePrimitive.Parts
          components={{
            Text: () => (
              <div className="ea-md">
                <MarkdownTextPrimitive />
              </div>
            ),
            Reasoning: ReasoningPart,
            ReasoningGroup,
            ToolGroup: ToolGroupBlock,
            tools: {
              by_name: { webSearch: WebSearchTool },
              Fallback: ToolFallback,
            },
          }}
        />
        {artifacts.length > 0 && (
          <div className="mt-2">
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
          <div className="mt-2">
            {failures.map((tool, i) => (
              <ArtifactFailureCard
                key={tool.toolCallId || `failed-${i}`}
                toolName={tool.toolName}
                errorText={tool.errorText}
              />
            ))}
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
      {!streaming && (
        <div className="-ml-2 flex items-center gap-0.5 pt-1">
          <MessageAction
            icon={<IconCopy className="size-4" />}
            label="Copy"
            onClick={() => void navigator.clipboard?.writeText(text)}
          />
          <MessagePrimitive.If last>
            <MessageAction
              icon={<IconRefresh className="size-4" />}
              label="Regenerate"
              onClick={actions.onRegenerate}
            />
          </MessagePrimitive.If>
          {metadata.interrupted && (
            <span className="ml-1 text-[11px] text-amber-600 dark:text-amber-500">
              · stopped
            </span>
          )}
        </div>
      )}
    </MessagePrimitive.Root>
  );
};

export const AgentMessage = () => {
  const role = useMessage((s) => s.role);
  if (role === 'user') return <UserMessageRow />;
  if (role === 'assistant') return <AssistantMessageRow />;
  return null;
};
