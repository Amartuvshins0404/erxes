import { Button, Dialog, Spinner } from 'erxes-ui';
import { useRemoveMembershipPlans } from '../hooks/useMembershipPlanMutations';

interface RemoveMembershipPlanDialogProps {
  planId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const RemoveMembershipPlanDialog = ({
  planId,
  open,
  onOpenChange,
  onClose,
}: RemoveMembershipPlanDialogProps) => {
  const { removeMembershipPlans, loading } = useRemoveMembershipPlans();

  const handleRemove = () => {
    removeMembershipPlans([planId]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Remove Membership Plan</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to remove this membership plan? This action
            cannot be undone.
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
            Remove Membership Plan
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};








