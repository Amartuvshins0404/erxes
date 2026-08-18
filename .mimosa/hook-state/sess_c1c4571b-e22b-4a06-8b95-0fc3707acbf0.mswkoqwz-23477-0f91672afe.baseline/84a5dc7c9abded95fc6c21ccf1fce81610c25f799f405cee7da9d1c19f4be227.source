import { Button, Dialog, Spinner } from 'erxes-ui';
import { useActivateMembershipPurchase } from '../hooks/useMembershipPurchaseMutations';

interface ActivateMembershipPurchaseDialogProps {
  purchaseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
}

export function ActivateMembershipPurchaseDialog({
  purchaseId,
  open,
  onOpenChange,
  onClose,
}: ActivateMembershipPurchaseDialogProps) {
  const { activateMembershipPurchase, loading } = useActivateMembershipPurchase();

  function handleClose() {
    onOpenChange(false);
    onClose?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Activate membership</Dialog.Title>
          <Dialog.Description>
            This will activate the purchase, update the customer membership expiry,
            and add plan credits to the customer balance.
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              activateMembershipPurchase({
                variables: { _id: purchaseId },
                onCompleted: () => handleClose(),
              });
            }}
            disabled={loading}
          >
            <Spinner show={loading} />
            Activate
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}

