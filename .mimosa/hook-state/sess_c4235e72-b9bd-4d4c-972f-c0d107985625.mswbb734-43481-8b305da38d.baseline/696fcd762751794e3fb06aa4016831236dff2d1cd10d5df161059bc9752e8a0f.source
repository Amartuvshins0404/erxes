import { useMutation } from '@apollo/client';
import { IconTransfer } from '@tabler/icons-react';
import { AlertDialog, Button, Spinner } from 'erxes-ui';
import { useEffect } from 'react';
import { useCurrentIdentifierId } from '../../../assistant-orgs/hooks/useAssistantOrg';
import { CREATE_OPENCODE_TRANSFER_CREDENTIALS } from '../graphql/mutations';

interface OpencodeTransferCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="grid gap-1">
    <span className="text-muted-foreground">{label}</span>
    <code className="font-mono break-all">{value || '-'}</code>
  </div>
);

export const OpencodeTransferCredentialsDialog = ({
  open,
  onOpenChange,
}: OpencodeTransferCredentialsDialogProps) => {
  const identifierId = useCurrentIdentifierId();
  const [loadCredentials, { data, loading, error }] = useMutation(
    CREATE_OPENCODE_TRANSFER_CREDENTIALS,
  );
  const credentials = data?.createOpencodeTransferCredentials;

  useEffect(() => {
    if (open && identifierId) {
      void loadCredentials({ variables: { identifierId } });
    }
  }, [identifierId, loadCredentials, open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content className="sm:max-w-lg">
        <AlertDialog.Header className="flex flex-row gap-3 sm:flex-row">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <IconTransfer className="text-primary h-5 w-5" />
          </div>
          <div className="flex flex-col gap-2 text-left">
            <AlertDialog.Title className="text-base font-semibold">
              Agent transfer credentials
            </AlertDialog.Title>
            <AlertDialog.Description className="text-muted-foreground text-sm">
              Paste these values into another SaaS to link this same opencode server there.
            </AlertDialog.Description>
          </div>
        </AlertDialog.Header>

        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : error ? (
          <p className="text-destructive text-sm">{error.message}</p>
        ) : (
          <div className="grid gap-4 rounded-md border p-4 text-sm">
            <Row label="Source SaaS" value={credentials?.sourceSubdomain} />
            <Row label="Server name" value={credentials?.serverName} />
            <Row label="Server URL" value={credentials?.serverUrl} />
            <Row label="Gateway token" value={credentials?.gatewayToken} />
            <Row label="Provider" value={credentials?.provider} />
            <Row label="Server ID" value={credentials?.serverId} />
            <Row label="Server password" value={credentials?.serverPassword} />
          </div>
        )}

        <AlertDialog.Footer className="flex gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
};
