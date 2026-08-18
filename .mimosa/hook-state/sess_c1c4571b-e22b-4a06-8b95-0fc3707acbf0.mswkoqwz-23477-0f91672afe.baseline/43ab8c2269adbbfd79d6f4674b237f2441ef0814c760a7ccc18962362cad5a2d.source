import { Button, Spinner, useConfirm } from 'erxes-ui';
import { IconTrash } from '@tabler/icons-react';
import { useClientsRemove } from '../hooks/useClientsRemove';

export const ClientDelete = ({
  clientId,
  onClose,
}: {
  clientId: string;
  onClose: () => void;
}) => {
  const { removeClient, loading } = useClientsRemove();
  const { confirm } = useConfirm();
  return (
    <Button
      onClick={() => {
        confirm({
          message: 'Are you sure you want to delete this client?',
        }).then(() => {
          removeClient({ variables: { id: clientId } });
          onClose();
        });
      }}
      variant="destructive"
      disabled={loading}
    >
      {loading ? (
        <Spinner size="sm" containerClassName="flex-none" />
      ) : (
        <IconTrash />
      )}
      Delete
    </Button>
  );
};
