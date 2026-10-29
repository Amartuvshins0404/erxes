import { AiAgentStepNotice } from '@/automations/components/settings/components/agents/components/detail/AiAgentStepNotice';
import { AiAgentConnectionSelect } from '@/automations/components/settings/components/agents/components/form/connection/AiAgentConnectionSelect';
import { AI_AGENT_CONNECTIONS_SETTINGS_PATH } from '@/automations/components/settings/components/agents/constants/providers';
import { useAiAgentDetailContext } from '@/automations/components/settings/components/agents/context/AiAgentDetailContext';
import { useAiAgentConnections } from '@/automations/components/settings/components/agents/hooks/useAiAgentConnections';
import { IconLoader2, IconPlugConnected } from '@tabler/icons-react';
import { Button, Card, Empty, Skeleton } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

const AiAgentConnectionsEmpty = () => {
  const { t } = useTranslation('automations');

  return (
    <Empty className="my-4">
      <Empty.Header>
        <Empty.Media variant="icon">
          <IconPlugConnected />
        </Empty.Media>
        <Empty.Title>{t('settings-agents-connection-empty-title')}</Empty.Title>
        <Empty.Description>
          {t('settings-agents-connection-empty-description')}
        </Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button asChild>
          <Link to={AI_AGENT_CONNECTIONS_SETTINGS_PATH}>
            <IconPlugConnected className="size-4" />
            {t('settings-agents-connection-manage')}
          </Link>
        </Button>
      </Empty.Content>
    </Empty>
  );
};

export const AiAgentConnectionStep = () => {
  const { t } = useTranslation('automations');
  const { isEditing, health } = useAiAgentDetailContext();
  const { connections, loaded, error } = useAiAgentConnections();

  return (
    <div className="grid gap-4">
      <AiAgentStepNotice step="connection" />
      <Card className="p-4">
        {!loaded && !error && <Skeleton className="h-9 w-full" />}
        {error && !loaded && (
          <p className="text-sm text-destructive">{error.message}</p>
        )}
        {loaded && connections.length === 0 && <AiAgentConnectionsEmpty />}
        {loaded && connections.length > 0 && (
          <div className="grid gap-4">
            <AiAgentConnectionSelect connections={connections} />
            <Button
              asChild
              variant="link"
              size="sm"
              className="w-fit px-0 text-muted-foreground"
            >
              <Link to={AI_AGENT_CONNECTIONS_SETTINGS_PATH}>
                {t('settings-agents-connection-manage')}
              </Link>
            </Button>
          </div>
        )}
      </Card>
      {isEditing && (
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => void health.refetch()}
            disabled={health.loading}
          >
            {health.loading && <IconLoader2 className="size-4 animate-spin" />}
            {t('settings-agents-connection-test')}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t('settings-agents-connection-test-hint')}
          </span>
        </div>
      )}
    </div>
  );
};
