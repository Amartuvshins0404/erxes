import { AgentMark } from '~/modules/chat/components/Avatars';

// Message avatar — the agent mark at message size; `live` sweeps the ring.
export const AgentAvatar = ({ live }: { live?: boolean }) => (
  <AgentMark size="md" working={live} />
);
