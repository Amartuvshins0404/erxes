import {
  IconAlertTriangle,
  IconMail,
  IconUsersGroup,
} from '@tabler/icons-react';
import { Avatar, Badge, Empty, InfoCard, readImage, Spinner } from 'erxes-ui';
import { useAgencyAgents } from '../hooks/useAgencyAgents';
import { IAgencyAgent } from '../types/agencyTypes';

const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'info'> = {
  admin: 'default',
  lead: 'info',
  member: 'secondary',
};

const getAgentName = (agent: IAgencyAgent) => {
  const { firstName, lastName, email } = agent.user ?? {};

  return [firstName, lastName].filter(Boolean).join(' ') || email || 'Unknown';
};

const getInitials = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('');

const AgentRow = ({ agent }: { agent: IAgencyAgent }) => {
  const name = getAgentName(agent);
  const { avatar, email } = agent.user ?? {};

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <Avatar size="lg" className="size-10 flex-none">
        {avatar && <Avatar.Image src={readImage(avatar)} alt={name} />}
        <Avatar.Fallback className="bg-primary/10 text-primary font-semibold">
          {getInitials(name)}
        </Avatar.Fallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate">{name}</p>
          {agent.role && (
            <Badge
              variant={ROLE_VARIANT[agent.role] ?? 'secondary'}
              className="capitalize"
            >
              {agent.role}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-nowrap truncate">
          {email && (
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              <IconMail className="size-3.5" />
              {email}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export const AgencyDetailAgents = () => {
  const { agents, totalCount, loading, error } = useAgencyAgents();

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard
        title={`Agents${totalCount ? ` (${totalCount})` : ''}`}
        description="Members the agency added in its own workspace, synced to block admin"
      >
        <InfoCard.Content>
          {loading && <Spinner containerClassName="py-12" />}

          {!loading && error && (
            <Empty>
              <Empty.Content>
                <Empty.Header>
                  <Empty.Media>
                    <IconAlertTriangle />
                  </Empty.Media>
                  <Empty.Title>Agents could not be loaded</Empty.Title>
                  <Empty.Description>{error.message}</Empty.Description>
                </Empty.Header>
              </Empty.Content>
            </Empty>
          )}

          {!loading && !error && !agents.length && (
            <Empty>
              <Empty.Content>
                <Empty.Header>
                  <Empty.Media>
                    <IconUsersGroup />
                  </Empty.Media>
                  <Empty.Title>No agents</Empty.Title>
                  <Empty.Description>
                    This agency has not added any members yet.
                  </Empty.Description>
                </Empty.Header>
              </Empty.Content>
            </Empty>
          )}

          {!loading && !error && !!agents.length && (
            <div className="grid grid-cols-2 gap-2">
              {agents.map((agent) => (
                <AgentRow key={agent._id} agent={agent} />
              ))}
            </div>
          )}
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};
