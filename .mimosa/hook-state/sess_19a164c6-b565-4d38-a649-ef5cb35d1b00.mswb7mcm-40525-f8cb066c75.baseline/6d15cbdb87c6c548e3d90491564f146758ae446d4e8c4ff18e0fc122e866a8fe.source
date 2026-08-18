import { Button, Dialog, DropdownMenu, Label, Textarea } from 'erxes-ui';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateSupplierVerification } from '../hooks/useUpdateSupplierVerification';

const STATUSES = ['verified', 'unverified'];

export const SupplierVerificationAction = ({
  supplierId,
  status,
  children,
}: {
  supplierId: string;
  status?: string;
  children: ReactNode;
}) => {
  const { t } = useTranslation('mushop');
  const { updateVerification } = useUpdateSupplierVerification();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState('');

  const handleSelect = (s: string) => {
    if (s === 'unverified') {
      setNote('');
      setRejectOpen(true);
    } else {
      updateVerification(supplierId, s);
    }
  };

  const handleConfirmReject = () => {
    updateVerification(supplierId, 'unverified', note);
    setRejectOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>
        <DropdownMenu.Content align="start">
          {STATUSES.map((s) => (
            <DropdownMenu.Item
              key={s}
              disabled={s === status}
              onClick={() => handleSelect(s)}
            >
              {t('Mark as {{status}}', { status: s })}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <Dialog.Content className="sm:max-w-md">
          <Dialog.Header>
            <Dialog.Title>{t('Reject supplier')}</Dialog.Title>
            <Dialog.Description>
              {t(
                'Provide a reason for rejection. This note will be sent to the supplier.',
              )}
            </Dialog.Description>
          </Dialog.Header>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reject-note">{t('Note')}</Label>
            <Textarea
              id="reject-note"
              placeholder={t('Enter rejection reason...')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
          </div>
          <Dialog.Footer>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmReject}>
              {t('Reject')}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </>
  );
};
