import { useEffect, useState } from 'react';
import { IconUser } from '@tabler/icons-react';

const AGENT_TEMPLATES_URL = 'https://agent-template-five.vercel.app';

const SOUL_TYPES = [
  'AGENTS',
  'SOUL',
  'TOOLS',
  'identity',
  'user',
  'bootstrap',
] as const;
type SoulType = (typeof SOUL_TYPES)[number];

const LABELS: Record<SoulType, string> = {
  AGENTS: 'AGENTS',
  SOUL: 'SOUL',
  TOOLS: 'TOOLS',
  identity: 'Identity',
  user: 'User',
  bootstrap: 'Bootstrap',
};

interface Soul {
  type: SoulType;
  content: string;
}
interface Agent {
  id: string;
  name: string;
  description: string;
  souls: Soul[];
}

interface Props {
  agentId: string;
}

export const AgentTemplateDetail = ({ agentId }: Props) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SoulType>('SOUL');

  useEffect(() => {
    fetch(`${AGENT_TEMPLATES_URL}/api/agents/${agentId}`)
      .then((r) => r.json())
      .then(setAgent)
      .finally(() => setLoading(false));
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex-1 flex items-center justify-center text-destructive text-sm">
        Agent not found
      </div>
    );
  }

  const soulMap = Object.fromEntries(
    agent.souls.map((s) => [s.type, s.content]),
  );
  const content = soulMap[activeTab] ?? '';

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <IconUser className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-card-foreground">{agent.name}</h2>
          {agent.description && (
            <p className="text-sm text-muted-foreground">{agent.description}</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {SOUL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === type
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {LABELS[type]}
            </button>
          ))}
        </div>

        <div className="p-5 min-h-64">
          {content ? (
            <pre className="text-sm font-mono text-foreground whitespace-pre-wrap">
              {content}
            </pre>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No content for this section.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
