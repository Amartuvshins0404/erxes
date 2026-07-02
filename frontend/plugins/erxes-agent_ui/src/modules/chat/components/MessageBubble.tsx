import { memo, type ReactNode } from 'react';
import { IconBolt, IconPencil, IconRefresh, IconRepeat } from '@tabler/icons-react';
import { Tooltip } from 'erxes-ui';
import { AgentUIMessage, ChatAttachment } from '~/modules/chat/types';
import { asToolPart, messageText } from '~/modules/chat/lib/uiParts';
import { artifactOutcomes, type Artifact } from '~/modules/chat/lib/artifacts';
import { AgentAvatar } from '~/modules/chat/components/Avatars';
import { AgentTrace } from '~/modules/chat/components/AgentTrace';
import {
  ArtifactCard,
  ArtifactFailureCard,
} from '~/modules/chat/components/ArtifactCard';
import {
  ChatMarkdown,
  StreamingMarkdown,
} from '~/modules/chat/components/ChatMarkdown';
import { CopyButton } from '~/modules/chat/components/CopyButton';
import { FeedbackButtons } from '~/modules/chat/components/FeedbackButtons';
import { MessageAttachments } from '~/modules/chat/components/MessageAttachments';

const formatTime = (iso?: string): string =>
  (iso ? new Date(iso) : new Date()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

// One icon-only message action (Edit, Resend, Regenerate) — the shared
// Tooltip+button shape extracted from the three near-identical trees that used
// to live inline. `aria-label={label}` gives every icon button an accessible
// name once, here, so screen readers announce the action rather than "button".
const MessageAction = ({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: ReactNode;
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

// memo() so a streaming turn only re-renders the live bubble, not every prior
// message — useChat keeps stable refs for settled messages, so shallow prop
// equality holds provided callers pass stable callbacks.
export const MessageBubble = memo(function MessageBubble({
  msg,
  isLast,
  chatLoading,
  ratingEnabled,
  onRegenerate,
  onRate,
  onEditMessage,
  onResendMessage,
  storeArtifacts,
  debug,
}: {
  msg: AgentUIMessage;
  isLast: boolean;
  chatLoading: boolean;
  ratingEnabled: boolean;
  onRegenerate: () => void;
  onRate: (messageId: string, rating: 1 | -1) => void;
  // Load a past user message back into the composer to tweak and send again.
  onEditMessage: (text: string) => void;
  // Send a past user message again as a new turn (text + its attachments).
  onResendMessage: (text: string, attachments: ChatAttachment[]) => void;
  // Persisted artifacts for this message — used when the live tool parts are
  // gone (after a reload), so the inline cards reappear.
  storeArtifacts?: Artifact[];
  // The agent's debug setting — when on, the trace shows the full tool-call
  // timeline; off shows only the turn summary + short thoughts.
  debug?: boolean;
}) {
  const text = messageText(msg);

  if (msg.role === 'user') {
    const attachments = msg.metadata?.attachments;
    const time = formatTime(msg.metadata?.createdAt);
    const hasText = !!text.trim();
    return (
      <div className="flex flex-col items-end gap-1 group ea-msg-in">
        {attachments && attachments.length > 0 && (
          <MessageAttachments attachments={attachments} />
        )}
        {hasText ? (
          <div className="ea-user-bubble text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm">
            {/* break-words so a long unbroken token (e.g. a base64 blob) wraps
                inside the bubble instead of spilling past its right edge. */}
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {text}
            </p>
            <p className="text-[10px] mt-1 text-primary-foreground/60">{time}</p>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground pr-1">{time}</p>
        )}
        {hasText && (
          <div className="flex items-center gap-0.5 pr-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageAction
              icon={<IconPencil className="size-3.5" />}
              label="Edit message"
              onClick={() => onEditMessage(text)}
            />
            <MessageAction
              icon={<IconRepeat className="size-3.5" />}
              label="Resend message"
              onClick={() => onResendMessage(text, attachments ?? [])}
              disabled={chatLoading}
            />
            <CopyButton text={text} />
          </div>
        )}
      </div>
    );
  }

  // assistant — a borderless, full-width reading column (no bubble), so long
  // answers read like a document and the width stays put while a reply streams.
  const streaming = isLast && chatLoading;
  const turnParts = msg.parts.filter(
    (p) => p.type === 'reasoning' || !!asToolPart(p),
  );
  // Charts and generated documents surface as prominent ArtifactCards (with a
  // Preview-panel opener), not buried in the collapsed thinking section. Live
  // turns read them off the tool parts; after a reload (tool parts gone) we fall
  // back to the persisted store artifacts for this message.
  const { artifacts: liveArtifacts, failures: failedArtifactTools } =
    artifactOutcomes(msg.parts);
  const artifacts = liveArtifacts.length
    ? liveArtifacts
    : (storeArtifacts ?? []);
  const canRegenerate = isLast && !chatLoading;
  const activeSkills = msg.metadata?.activeSkills;
  const messageId = msg.metadata?.messageId;
  const handleRate =
    ratingEnabled && messageId
      ? (rating: 1 | -1) => onRate(messageId, rating)
      : undefined;

  return (
    <div className="flex justify-start items-start gap-3 group ea-msg-in">
      <AgentAvatar live={streaming} />
      {/* A borderless reading column (no bubble) so long answers read like a
          document. Hold full width during streaming so it doesn't snap wider
          when the first artifact tool call lands mid-turn. */}
      <div className={`min-w-0 px-1 py-1 ${streaming || artifacts.length > 0 ? 'w-full' : 'w-auto max-w-full'}`}>

        {activeSkills && activeSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mb-1.5">
            {activeSkills.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium"
                title={`Skill "${name}" was applied to this reply`}
              >
                <IconBolt className="size-3" />
                {name}
              </span>
            ))}
          </div>
        )}
        {(turnParts.length > 0 || msg.metadata?.turnSummary) && (
          <AgentTrace
            parts={turnParts}
            streaming={streaming}
            summaries={msg.metadata?.reasoningSummaries}
            turnSummary={msg.metadata?.turnSummary}
            debug={debug}
          />
        )}
        {text ? (
          streaming ? (
            <StreamingMarkdown content={text} />
          ) : (
            <ChatMarkdown content={text} />
          )
        ) : streaming && !turnParts.length ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="ea-typing-dot" />
            <span className="ea-typing-dot" />
            <span className="ea-typing-dot" />
          </div>
        ) : null}
        {streaming && text && <span className="ea-caret" />}
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
        {failedArtifactTools.length > 0 && (
          <div className="mt-1">
            {failedArtifactTools.map((tool, i) => (
              <ArtifactFailureCard
                key={tool.toolCallId || `failed-${i}`}
                toolName={tool.toolName}
                errorText={
                  tool.errorText ||
                  (tool.output as { message?: string } | undefined)?.message
                }
              />
            ))}
          </div>
        )}
        {!streaming && (
          <div className="flex items-center justify-between gap-2 mt-1.5">
            <p className="text-[10px] text-muted-foreground">
              {formatTime(msg.metadata?.createdAt)}
              {msg.metadata?.interrupted && (
                <span className="ml-1.5 text-amber-600 dark:text-amber-500">
                  · stopped
                </span>
              )}
            </p>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {canRegenerate && (
                <MessageAction
                  icon={<IconRefresh className="size-3.5" />}
                  label="Regenerate"
                  onClick={onRegenerate}
                />
              )}
              {handleRate && (
                <FeedbackButtons rating={msg.metadata?.rating} onRate={handleRate} />
              )}
              <CopyButton text={text} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
