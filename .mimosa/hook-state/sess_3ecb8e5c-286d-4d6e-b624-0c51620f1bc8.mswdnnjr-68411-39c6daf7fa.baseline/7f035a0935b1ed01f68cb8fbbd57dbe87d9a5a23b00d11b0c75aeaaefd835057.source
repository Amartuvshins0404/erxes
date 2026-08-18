import { Button, Spinner, useConfirm } from 'erxes-ui';
import { IconTrash } from '@tabler/icons-react';
import { useRiskGroupsRemove } from '../hooks/useRiskGroupsRemove';

export const RiskGroupDelete = ({
  riskGroupId,
  onClose,
}: {
  riskGroupId: string;
  onClose: () => void;
}) => {
  const { removeRiskGroup, loading } = useRiskGroupsRemove();
  const { confirm } = useConfirm();
  return (
    <Button
      onClick={() => {
        confirm({
          message: 'Are you sure you want to delete this risk group?',
        }).then(() => {
          removeRiskGroup({ variables: { id: riskGroupId } });
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

