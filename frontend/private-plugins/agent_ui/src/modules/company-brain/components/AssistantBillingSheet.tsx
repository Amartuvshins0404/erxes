import { IconLink, IconRefresh } from '@tabler/icons-react';
import { Alert, Button, Sheet } from 'erxes-ui';
import { useState } from 'react';
import type { AgentAssistantBillingOverview } from '~/modules/assistant-orgs/hooks/useAgentAssistantLimit';

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const AssistantBillingSheet = ({
  overview,
  loading,
}: {
  overview?: AgentAssistantBillingOverview | null;
  loading?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const items = overview?.items || [];
  const blocked = !!overview?.blocked;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button variant="outline" className="gap-2">
          <IconLink className="h-4 w-4" />
          Billing status
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 md:w-[calc(100vw-theme(spacing.4))] sm:max-w-2xl">
        <Sheet.Header>
          <IconLink />
          <Sheet.Title>AI Assistant billing</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content className="flex min-h-0 flex-1 flex-col gap-5 px-5 py-5">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconRefresh className="size-4 animate-spin" />
              Loading billing status
            </div>
          ) : (
            <>
              {blocked && overview?.message && (
                <Alert variant="warning">
                  <Alert.Title>You have to pay</Alert.Title>
                  <Alert.Description>{overview.message}</Alert.Description>
                </Alert>
              )}

              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    No assistant billing records were found.
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.identifierId}
                      className="rounded-lg border border-border bg-muted/20 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-foreground">
                            {item.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.description || item.slug}
                          </div>
                        </div>
                        <div className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">
                          {item.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                        <div>
                          <div className="text-muted-foreground">
                            Start date
                          </div>
                          <div className="mt-1 font-medium">
                            {formatDate(item.planStartDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">End date</div>
                          <div className="mt-1 font-medium">
                            {formatDate(item.planEndDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Status</div>
                          <div className="mt-1 font-medium">
                            {item.blocked ? 'Blocked' : 'Active'}
                          </div>
                        </div>
                      </div>

                      {item.blocked && (
                        <div className="mt-3 text-xs text-destructive">
                          {item.message}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {overview?.billingUrl && (
                <div className="flex items-center justify-end">
                  <Button asChild>
                    <a
                      href={overview.billingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="gap-2"
                    >
                      <IconLink className="h-4 w-4" />
                      Pay bills
                    </a>
                  </Button>
                </div>
              )}
            </>
          )}
        </Sheet.Content>
      </Sheet.View>
    </Sheet>
  );
};
