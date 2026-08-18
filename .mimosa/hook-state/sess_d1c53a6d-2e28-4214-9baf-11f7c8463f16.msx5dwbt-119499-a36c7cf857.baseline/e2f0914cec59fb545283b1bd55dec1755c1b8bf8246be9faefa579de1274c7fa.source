import { Button, Spinner, useConfirm } from 'erxes-ui';
import { IconTrash } from '@tabler/icons-react';
import { useMarketsRemove } from '../hooks/useMarketsRemove';

export const MarketDelete = ({
  marketId,
  onClose,
}: {
  marketId: string;
  onClose: () => void;
}) => {
  const { removeMarket, loading } = useMarketsRemove();
  const { confirm } = useConfirm();
  return (
    <Button
      onClick={() => {
        confirm({
          message: 'Are you sure you want to delete this market?',
        }).then(() => {
          removeMarket({ variables: { id: marketId } });
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

