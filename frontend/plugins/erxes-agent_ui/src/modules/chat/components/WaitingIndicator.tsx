import { AgentAvatar } from '~/modules/chat/components/AgentAvatar';

// Shown only between sending and the first streamed event — once thinking /
// tool / text events arrive, the live assistant column takes over. Borderless to
// match that column (no bubble), so there's no shape-change on the handoff.
export const WaitingIndicator = () => (
  <div className="flex items-start gap-3 ea-msg-in">
    <AgentAvatar live />
    <div className="flex items-center gap-1.5 pt-2.5">
      <span className="ea-typing-dot" />
      <span className="ea-typing-dot" />
      <span className="ea-typing-dot" />
    </div>
  </div>
);
