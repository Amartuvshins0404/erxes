import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IconUser, IconExternalLink } from '@tabler/icons-react';

const AGENT_TEMPLATES_URL = 'https://agent-template-five.vercel.app';

interface Agent {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export const AgentTemplatesList = () => {
  const location = useLocation();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${AGENT_TEMPLATES_URL}/api/agents`)
      .then((r) => r.json())
      .then(setAgents)
      .catch(() => setError('Could not load agents'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Loading agents...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-destructive text-sm">
        {error}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <IconUser className="w-10 h-10 opacity-30" />
        <p className="text-sm">No agents yet.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
        {agents.map((agent) => (
          <Link
            key={agent.id}
            to={`/agent/templates/${agent.id}${location.search}`}
            className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconUser className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-card-foreground">
                  {agent.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(agent.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {agent.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {agent.description}
              </p>
            )}
            <span className="mt-auto text-xs text-primary font-medium flex items-center gap-1 group-hover:gap-1.5 transition-all">
              View agent <IconExternalLink className="w-3 h-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};
