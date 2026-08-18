import { Button, Dialog, Spinner } from 'erxes-ui';
import { useRemoveCreditTransactions } from '../hooks/useCreditMutations';

interface RemoveCreditTransactionDialogProps {
  transactionIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const RemoveCreditTransactionDialog = ({
  transactionIds,
  open,
  onOpenChange,
  onClose,
}: RemoveCreditTransactionDialogProps) => {
  const { removeCreditTransactions, loading } = useRemoveCreditTransactions();

  const handleRemove = async () => {
    await removeCreditTransactions(transactionIds);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Remove Credit Transaction</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to remove{' '}
            {transactionIds.length === 1
              ? 'this credit transaction'
              : `these ${transactionIds.length} credit transactions`}
            ? This action cannot be undone.
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
            Remove {transactionIds.length === 1 ? 'Transaction' : 'Transactions'}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

