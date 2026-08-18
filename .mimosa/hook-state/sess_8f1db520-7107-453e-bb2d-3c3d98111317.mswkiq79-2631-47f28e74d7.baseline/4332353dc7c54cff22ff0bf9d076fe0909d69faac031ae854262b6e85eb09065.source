import { useMutation } from '@apollo/client';
import { IconLink, IconRefresh } from '@tabler/icons-react';
import { Alert, Button, Checkbox, Sheet, useToast } from 'erxes-ui';
import { useEffect, useMemo, useState } from 'react';
import { SET_ASSISTANT_PLAN_SELECTION } from '~/modules/assistant-orgs/graphql/mutations';
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
  limit,
  onChanged,
}: {
  overview?: AgentAssistantBillingOverview | null;
  loading?: boolean;
  limit?: number | null;
  onChanged?: () => void;
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const items = useMemo(() => overview?.items || [], [overview?.items]);
  const blocked = !!overview?.blocked;
  const maxActive = typeof limit === 'number' ? limit : items.length;

  // Local selection of which assistants occupy the paid plan slots.
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelected(
      new Set(
        items.filter((item) => item.planActive).map((item) => item.identifierId),
      ),
    );
  }, [items]);

  const [saveSelection, { loading: saving }] = useMutation(
    SET_ASSISTANT_PLAN_SELECTION,
  );

  const selectionEnabled = !blocked && items.length > maxActive;

  const toggle = (identifierId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);

      if (checked) {
        if (next.size >= maxActive) {
          return prev;
        }
        next.add(identifierId);
      } else {
        next.delete(identifierId);
      }

      return next;
    });
  };

  const handleSave = async () => {
    try {
      await saveSelection({
        variables: { identifierIds: Array.from(selected) },
      });

      toast({ title: 'Active assistants updated' });
      onChanged?.();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to update selection',
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

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

              {selectionEnabled && (
                <Alert>
                  <Alert.Title>Choose active assistants</Alert.Title>
                  <Alert.Description>
                    Your plan covers {maxActive} assistant
                    {maxActive === 1 ? '' : 's'}. Select which ones stay active (
                    {selected.size}/{maxActive} selected).
                  </Alert.Description>
                </Alert>
              )}

              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    No assistant billing records were found.
                  </div>
                ) : (
                  items.map((item) => {
                    const isChecked = selected.has(item.identifierId);
                    const disableCheck =
                      !isChecked && selected.size >= maxActive;

                    return (
                      <div
                        key={item.identifierId}
                        className="rounded-lg border border-border bg-muted/20 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            {selectionEnabled && (
                              <Checkbox
                                className="mt-0.5"
                                checked={isChecked}
                                disabled={disableCheck || saving}
                                onCheckedChange={(checked) =>
                                  toggle(item.identifierId, checked === true)
                                }
                              />
                            )}
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-foreground">
                                {item.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.description || item.slug}
                              </div>
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
                            <div className="text-muted-foreground">
                              End date
                            </div>
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
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                {selectionEnabled && (
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && (
                      <IconRefresh className="size-4 animate-spin" />
                    )}
                    Save selection
                  </Button>
                )}
                {overview?.billingUrl && (
                  <Button asChild variant="outline">
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
                )}
              </div>
            </>
          )}
        </Sheet.Content>
      </Sheet.View>
    </Sheet>
  );
};
