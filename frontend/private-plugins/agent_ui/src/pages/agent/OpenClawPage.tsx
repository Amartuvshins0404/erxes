import { IconSparkles } from '@tabler/icons-react';
import { Alert, Breadcrumb, Button, Separator, Spinner } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { useIdentifier } from '~/modules/assistant-orgs/hooks/useAssistantOrg';
import { useAgentAssistantLimit } from '~/modules/assistant-orgs/hooks/useAgentAssistantLimit';
import { AgentMain } from '~/modules/main/AgentMain';

export const OpenClawIndexPage = () => {
  const { identifier } = useIdentifier();
  const { limit, loading } = useAgentAssistantLimit(true);
  const billingOverview = limit?.billingOverview;
  const billingItem = billingOverview?.items?.find(
    (item) => item.identifierId === identifier?._id,
  );
  // Block this specific assistant when it is unpaid or sits outside the plan's
  // active slots. Fall back to the global flag while the identifier is loading.
  const billingBlocked = identifier?._id
    ? !!billingItem?.blocked
    : !!billingOverview?.blocked;
  const billingMessage =
    billingItem?.message ||
    billingOverview?.message ||
    'This AI Assistant is blocked until the bill is paid.';

  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/agent/assistant">
                    <IconSparkles />
                    AI Assistant
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Page>
                  {identifier?.name || 'Server'}
                </Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>

      {loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : billingBlocked ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          <Alert variant="warning">
            <Alert.Title>You have to pay</Alert.Title>
            <Alert.Description>{billingMessage}</Alert.Description>
          </Alert>
          <div className="flex flex-wrap items-center gap-2">
            {billingOverview?.billingUrl && (
              <Button asChild>
                <a
                  href={billingOverview.billingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Pay bills
                </a>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/agent/assistant">Back to AI Assistant</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <AgentMain />
        </div>
      )}
    </div>
  );
};
