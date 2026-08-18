import { Button, Spinner, useConfirm } from 'erxes-ui';
import { IconTrash } from '@tabler/icons-react';
import { useDeleteOppty } from '../hooks/useDeleteOppty';

export const OpptyDelete = ({
  opptyId,
  onClose,
}: {
  opptyId: string;
  onClose: () => void;
}) => {
  const { removeOppty, loading } = useDeleteOppty();
  const { confirm } = useConfirm();

  return (
    <Button
      onClick={() => {
        confirm({
          message: 'Are you sure you want to delete this opportunity?',
        }).then(() => {
          removeOppty({ variables: { _id: opptyId } });
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
