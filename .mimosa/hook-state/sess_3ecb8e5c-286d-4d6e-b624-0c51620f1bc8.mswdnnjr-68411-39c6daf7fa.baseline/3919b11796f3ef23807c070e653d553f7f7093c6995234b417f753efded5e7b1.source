import { IconLock } from '@tabler/icons-react';
import { AlertDialog, Button, Spinner } from 'erxes-ui';
import { useOpencodeCredentials } from '../hooks/useOpencodeApiKey';

interface OpencodeCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OpencodeCredentialsDialog = ({
  open,
  onOpenChange,
}: OpencodeCredentialsDialogProps) => {
  const { credentials, loading } = useOpencodeCredentials(!open);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content className="sm:max-w-md">
        <AlertDialog.Header className="flex flex-row gap-3 sm:flex-row">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <IconLock className="text-primary h-5 w-5" />
          </div>
          <div className="flex flex-col gap-2 text-left">
            <AlertDialog.Title className="text-base font-semibold">
              Opencode login
            </AlertDialog.Title>
            <AlertDialog.Description className="text-muted-foreground text-sm">
              Use these credentials if the iframe prompts for authentication.
            </AlertDialog.Description>
          </div>
        </AlertDialog.Header>

        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-4 rounded-md border p-4 text-sm">
            <div className="grid gap-1">
              <span className="text-muted-foreground">Username</span>
              <code className="font-mono">{credentials?.username || '-'}</code>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">Password</span>
              <code className="font-mono break-all">
                {credentials?.password || '-'}
              </code>
            </div>
          </div>
        )}

        <AlertDialog.Footer className="flex gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
};
