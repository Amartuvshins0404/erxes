import { Button, Dialog, Spinner } from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { useRemoveProviders } from '../hooks/useProviderMutations';
import { ONE_FIT_PROVIDER } from '../graphql/providerQueries';

interface RemoveProviderDialogProps {
  providerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const RemoveProviderDialog = ({
  providerId,
  open,
  onOpenChange,
  onClose,
}: RemoveProviderDialogProps) => {
  const { data } = useQuery(ONE_FIT_PROVIDER, {
    variables: { _id: providerId },
    skip: !open,
  });

  const provider = data?.oneFitProvider;
  const { removeProviders, loading } = useRemoveProviders();

  const handleRemove = () => {
    removeProviders([providerId]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Remove Provider</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to remove{' '}
            <strong>{provider?.businessName.mn}</strong>? This action cannot be
            undone.
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            disabled={loading}
          >
            <Spinner show={loading} />
            Remove Provider
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};
