import { Button, Dialog, Spinner } from 'erxes-ui';
import {
  useRemoveScheduleTemplates,
  useRemoveScheduleException,
} from '../hooks/useScheduleMutations';

interface RemoveDialogProps {
  type: 'template' | 'exception';
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const RemoveDialog = ({
  type,
  id,
  open,
  onOpenChange,
  onClose,
}: RemoveDialogProps) => {
  const { removeScheduleTemplates, loading: templatesLoading } =
    useRemoveScheduleTemplates();
  const { removeScheduleException, loading: exceptionLoading } =
    useRemoveScheduleException();

  const loading = type === 'template' ? templatesLoading : exceptionLoading;

  const handleRemove = () => {
    if (type === 'template') {
      removeScheduleTemplates([id]);
    } else {
      removeScheduleException(id);
    }
    onClose();
  };

  const title =
    type === 'template'
      ? 'Remove Schedule Template'
      : 'Remove Schedule Exception';
  const description =
    type === 'template'
      ? 'Are you sure you want to remove this schedule template? This action cannot be undone.'
      : 'Are you sure you want to remove this schedule exception? This action cannot be undone.';
  const buttonText =
    type === 'template'
      ? 'Remove Schedule Template'
      : 'Remove Schedule Exception';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
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
            {buttonText}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

// Export convenience components for backward compatibility
export const RemoveScheduleTemplateDialog = ({
  templateId,
  open,
  onOpenChange,
  onClose,
}: {
  templateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}) => (
  <RemoveDialog
    type="template"
    id={templateId}
    open={open}
    onOpenChange={onOpenChange}
    onClose={onClose}
  />
);

export const RemoveScheduleExceptionDialog = ({
  exceptionId,
  open,
  onOpenChange,
  onClose,
}: {
  exceptionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}) => (
  <RemoveDialog
    type="exception"
    id={exceptionId}
    open={open}
    onOpenChange={onOpenChange}
    onClose={onClose}
  />
);
