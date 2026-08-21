import { useTranslation } from 'react-i18next';
import { AlertDialog } from 'erxes-ui';

// Confirm-before-delete for a chat session (replaces the native window.confirm).
export const DeleteSessionDialog = ({
  open,
  loading,
  onOpenChange,
  onConfirm,
}: {
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) => {
  const { t } = useTranslation('mastra');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>{t('delete-session-title')}</AlertDialog.Title>
          <AlertDialog.Description>
            {t('delete-session-description')}
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel disabled={loading}>
            {t('cancel')}
          </AlertDialog.Cancel>
          <AlertDialog.Action
            disabled={loading}
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground ea-hover-destructive-90"
          >
            {loading ? t('deleting') : t('delete')}
          </AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
};
