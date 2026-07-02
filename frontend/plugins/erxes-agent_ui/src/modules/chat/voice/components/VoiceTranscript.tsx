import { AgentUIMessage } from '~/modules/chat/types';
import { messageText } from '~/modules/chat/lib/uiParts';
import { ChatMarkdown } from '~/modules/chat/components/ChatMarkdown';

// The optional transcript view inside voice mode — hidden by default, shown via
// the overlay's toggle. A compact, read-only echo of the spoken conversation so
// the user can glance at what was said without leaving hands-free mode. Reads
// the AI SDK UIMessages directly (text is concatenated from their text parts).

const ROLE_LABEL: Partial<Record<AgentUIMessage['role'], string>> = {
  user: 'You',
  assistant: 'Assistant',
};

export const VoiceTranscript = ({
  messages,
}: {
  messages: AgentUIMessage[];
}) => {
  // Hidden approve/deny sends carry no visible bubble — skip them here too.
  const visible = messages.filter(
    (m) => !m.metadata?.hidden && (m.role === 'user' || m.role === 'assistant'),
  );

  if (!visible.length) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        Your conversation will appear here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {visible.map((m) => {
        const text = messageText(m);
        return (
          <div key={m.id} className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
              {ROLE_LABEL[m.role] ?? m.role}
            </span>
            {m.role === 'assistant' ? (
              <ChatMarkdown content={text} />
            ) : (
              <p className="text-sm whitespace-pre-wrap text-foreground">
                {text}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
