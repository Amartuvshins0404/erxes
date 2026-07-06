import { IconAlertTriangle } from '@tabler/icons-react';
import { AlertDialog, Button } from 'erxes-ui';
import { useEffect, useState } from 'react';
import type {
  AgentAssistantBillingWarning,
  AgentAssistantBillingOverview,
} from '~/modules/assistant-orgs/hooks/useAgentAssistantLimit';

const formatDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString();
};

/**
 * Shows a blocking payment warning EVERY time Company Brain is opened while an
 * AI Assistant bundle payment is overdue. The dialog is keyed to the warning so
 * navigating back into Company Brain (which remounts this component) re-opens
 * it, even if the user dismissed it last time.
 */
export const AssistantPaymentAlertDialog = ({
  warning,
  overview,
  payUrl,
}: {
  warning?: AgentAssistantBillingWarning | null;
  overview?: AgentAssistantBillingOverview | null;
  payUrl?: string | null;
}) => {
  const active = !!warning?.active || !!overview?.blocked;
  const [open, setOpen] = useState(active);

  // Re-open on every mount / whenever the warning becomes active again.
  useEffect(() => {
    setOpen(active);
  }, [active]);

  if (!active) {
    return null;
  }

  const deletionDate = formatDate(warning?.deletionDate);
  const daysUntilDeletion = warning?.daysUntilDeletion ?? 0;
  const deletionDue = !!warning?.deletionDue;
  const billingUrl = payUrl || overview?.billingUrl || undefined;

  const title = deletionDue
    ? 'Your AI Assistant server is scheduled for deletion'
    : 'Payment required for your AI Assistant';

  const description =
    warning?.message ||
    overview?.message ||
    'Your AI Assistant bundle payment is overdue.';

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialog.Content className="sm:max-w-md">
        <AlertDialog.Header className="flex flex-row gap-3 sm:flex-row">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <IconAlertTriangle className="text-destructive h-5 w-5" />
          </div>
          <div className="flex flex-col gap-2 text-left">
            <AlertDialog.Title className="text-base font-semibold">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-muted-foreground text-sm">
              {description}
            </AlertDialog.Description>
          </div>
        </AlertDialog.Header>

        {!deletionDue && warning?.active && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Server deletion in
              </span>
              <span className="font-semibold text-destructive">
                {daysUntilDeletion} day{daysUntilDeletion === 1 ? '' : 's'}
              </span>
            </div>
            {deletionDate && (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">Deletion date</span>
                <span className="font-medium">{deletionDate}</span>
              </div>
            )}
          </div>
        )}

        <AlertDialog.Footer className="flex gap-2 sm:justify-end">
          <AlertDialog.Cancel type="button">Later</AlertDialog.Cancel>
          {billingUrl && (
            <Button asChild type="button" className="min-w-28">
              <a href={billingUrl} target="_blank" rel="noreferrer">
                Pay now
              </a>
            </Button>
          )}
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
};
