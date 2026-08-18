import { Button, Dialog, Spinner } from 'erxes-ui';
import { useRemoveActivityTypes } from '../hooks/useActivityTypeMutations';

interface RemoveActivityTypeDialogProps {
  activityTypeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const RemoveActivityTypeDialog = ({
  activityTypeId,
  open,
  onOpenChange,
  onClose,
}: RemoveActivityTypeDialogProps) => {
  const { removeActivityTypes, loading } = useRemoveActivityTypes();

  const handleRemove = () => {
    removeActivityTypes([activityTypeId]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Remove Activity Type</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to remove this activity type? This action
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
            Remove Activity Type
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};









