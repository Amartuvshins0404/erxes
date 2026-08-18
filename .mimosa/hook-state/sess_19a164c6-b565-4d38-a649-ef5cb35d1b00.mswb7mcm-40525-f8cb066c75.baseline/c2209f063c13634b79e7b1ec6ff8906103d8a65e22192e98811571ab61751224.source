import { Button, Dialog, Spinner } from 'erxes-ui';
import { useRemoveCategories } from '../hooks/useCategoryMutations';

interface RemoveCategoryDialogProps {
  categoryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const RemoveCategoryDialog = ({
  categoryId,
  open,
  onOpenChange,
  onClose,
}: RemoveCategoryDialogProps) => {
  const { removeCategories, loading } = useRemoveCategories();

  const handleRemove = () => {
    removeCategories([categoryId]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Remove Category</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to remove this category? This action cannot be
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
            Remove Category
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

