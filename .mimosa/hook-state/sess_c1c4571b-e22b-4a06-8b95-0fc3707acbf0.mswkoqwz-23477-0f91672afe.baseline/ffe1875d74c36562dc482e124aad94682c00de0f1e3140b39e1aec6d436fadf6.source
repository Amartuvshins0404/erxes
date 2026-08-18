import {
  IconArrowRight,
  IconCode,
  IconSparkles,
} from '@tabler/icons-react';
import { Breadcrumb, Button, Separator, Spinner } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { useAssistantOrg } from '~/modules/assistant-orgs/hooks/useAssistantOrg';
import { useAgent } from '~/modules/main/hooks/useAgent';
import { SERVER_STATUSES } from '~/modules/deploy/constants';
import { useOpencode } from '~/modules/opencode/main/hooks/useOpencode';

const getStatusLabel = (status?: string | null) => {
  if (!status) {
    return 'Not deployed';
  }

  if (status === SERVER_STATUSES.APPROVED) {
    return 'Ready';
  }

  if (status === SERVER_STATUSES.DEPLOYING) {
    return 'Deploying';
  }

  return status;
};

export const AssistantOrgIndexPage = () => {
  const { org, loading: orgLoading } = useAssistantOrg();
  const { agent, loading: agentLoading } = useAgent();
  const { opencode, loading: opencodeLoading } = useOpencode();

  const cards = [
    {
      title: 'OpenClaw',
      description:
        'Discord-connected assistant workspace with agent management, restart controls, and deploy flow.',
      icon: IconSparkles,
      path: 'openclaw',
      accent: 'bg-primary/10 text-primary',
      status: getStatusLabel(agent?.status),
    },
    {
      title: 'Opencode',
      description:
        'Provider-backed coding workspace for this org, including deploy, restart, and iframe session.',
      icon: IconCode,
      path: 'opencode',
      accent: 'bg-emerald-500/10 text-emerald-600',
      status: getStatusLabel(opencode?.status),
    },
  ] as const;

  if (orgLoading || agentLoading || opencodeLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/agent/agent">
                    <IconSparkles />
                    AI assistant
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Page>{org?.name || 'Organization'}</Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {org?.name || 'Assistant Organization'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Choose which assistant environment to manage for this org.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.title}
                  to={card.path}
                  className="group flex min-h-60 flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.accent}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {card.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-base font-semibold text-card-foreground">
                      {card.title}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {card.description}
                    </p>
                  </div>

                  <span className="mt-auto flex items-center gap-1 text-xs font-medium text-primary transition-all group-hover:gap-1.5">
                    Open {card.title} <IconArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
