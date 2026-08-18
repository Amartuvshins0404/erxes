import { useContext, type PropsWithChildren } from 'react';
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
import {
  parseAskUserAnswer,
  type AgentMessageMetadata,
} from '~/modules/chat/types';
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
import { ToolGroupBlock } from '~/modules/chat/assistant/ToolGroupBlock';
import { AskUserCard } from '~/modules/chat/assistant/AskUserTool';

// 32px quiet icon button, background-only hover — the clone's action control.
// ea-quiet-btn owns the hover wash (plugin-unique utilities don't reach prod).
const actionClass =
  'ea-quiet-btn flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground';

// Mirrors assistant-ui's internal MessagePartGroup (not exported at the root).
type MessagePartGroup = { groupKey: string | undefined; indices: number[] };

const TOOL_ACTIVITY_GROUP = 'ea-tool-activity';

// Grouping handed to assistant-ui's Unstable_PartsGrouped: every activity part
// of the turn — reasoning bursts AND tool calls — lands in ONE activity group
// (a single ChatGPT-style process line instead of per-part rows), spliced in
// at the position of the first activity part; all other parts render ungrouped
// in place. Reasoning never renders as rows in the message body.
const groupTurnActivity = (
  parts: readonly { type: string }[],
): MessagePartGroup[] => {
  const groups: MessagePartGroup[] = [];
  const activityIndices: number[] = [];
  let activityGroupAt = -1;
  parts.forEach((part, index) => {
    if (part.type === 'tool-call' || part.type === 'reasoning') {
      if (activityIndices.length === 0) activityGroupAt = groups.length;
      activityIndices.push(index);
      return;
    }
    groups.push({ groupKey: undefined, indices: [index] });
  });
  if (activityIndices.length > 0) {
    groups.splice(activityGroupAt, 0, {
      groupKey: TOOL_ACTIVITY_GROUP,
      indices: activityIndices,
    });
  }
  return groups;
};

// Routes each library-formed group to its chrome: the single process line, or
// an ungrouped passthrough.
const PartGroup = ({
  groupKey,
  indices,
  children,
}: PropsWithChildren<{ groupKey: string | undefined; indices: number[] }>) => {
  if (groupKey === TOOL_ACTIVITY_GROUP) {
    return <ToolGroupBlock indices={indices} />;
  }
  return children;
};

// PascalCase alias for the library primitive (react/jsx-pascal-case).
const PartsGrouped = MessagePrimitive.Unstable_PartsGrouped;

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
  // ask_user answer/skip replays hide by CONVENTION, not only metadata: the
  // persisted row carries no hidden flag, so after reload the metadata path
  // alone misses them and the bubble would show next to the card's receipt
  // (which parses the same convention back — see AskUserCard).
  if (metadata.hidden || parseAskUserAnswer(text)) return null;

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
        <div className="ea-user-bubble">
          <p className="ea-text-15 whitespace-pre-wrap break-words">{text}</p>
        </div>
      )}
      {(hasText || persistedMessageId) && (
        <div className="ea-reveal flex items-center gap-0.5">
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
  // A turn that ended on ask_user renders the question card instead of text —
  // it must never trip the blank-bubble guard below.
  const endsOnQuestion = useMessage((s) =>
    s.content.some(
      (p) =>
        p.type === 'tool-call' &&
        (p as { toolName?: string }).toolName === 'ask_user',
    ),
  );
  const extras = useContext(MessageExtrasContext).get(id);
  const streaming = !!extras?.streaming;
  const artifacts = extras?.artifacts ?? [];
  const failures = extras?.failures ?? [];

  return (
    <MessagePrimitive.Root className="mx-auto flex w-full max-w-3xl flex-col group ea-msg-in">
      <div className="ea-text-15 leading-7">
        <PartsGrouped
          groupingFunction={groupTurnActivity}
          components={{
            Text: () => (
              <div className="ea-md">
                <MarkdownTextPrimitive />
              </div>
            ),
            Group: PartGroup,
            // Activity parts never render individually — the ToolGroupBlock
            // group swallows them (it renders no children), so the per-part
            // fallback is inert by construction.
            tools: { Fallback: () => null },
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
        <AskUserCard />
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
            as a blank bubble — surface the outcome and offer a retry. A turn
            that ended on ask_user renders the question card instead. */}
        {!streaming &&
          !text.trim() &&
          !endsOnQuestion &&
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
            <span className="ea-text-11 ml-1 text-amber-600">
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
