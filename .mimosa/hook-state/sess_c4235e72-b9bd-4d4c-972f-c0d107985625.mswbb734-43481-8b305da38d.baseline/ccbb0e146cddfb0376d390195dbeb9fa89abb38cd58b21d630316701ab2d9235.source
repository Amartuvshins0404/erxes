import { IconGift } from '@tabler/icons-react';
import { Button, Sheet, Spinner } from 'erxes-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGrantSheetState } from '../hooks/useGrantSheetState';
import { DetailsCard } from './grant/DetailsCard';
import { InvoiceCard } from './grant/InvoiceCard';
import { PaymentForm } from './grant/PaymentForm';
import { PaymentMirrorCard } from './grant/PaymentMirrorCard';
import { SummaryCard } from './grant/SummaryCard';

export const GrantMembershipSheet = () => {
  const { t } = useTranslation('mushop');
  const [open, setOpen] = useState(false);
  const state = useGrantSheetState(open);
  const {
    customerId,
    planId,
    showPreview,
    isExtending,
    granting,
    submit,
    reset,
  } = state;

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const onSubmit = async () => {
    await submit();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Sheet.Trigger asChild>
        <Button variant="outline" size="sm">
          {t('Add Membership')}
        </Button>
      </Sheet.Trigger>
      <Sheet.View
        className={
          showPreview
            ? 'p-0 md:w-[calc(100vw-theme(spacing.4))] sm:max-w-3xl'
            : 'p-0 md:w-[calc(100vw-theme(spacing.4))] sm:max-w-md'
        }
      >
        <Sheet.Header>
          <Sheet.Title>{t('Add Membership')}</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>

        <Sheet.Content
          className={
            showPreview
              ? 'flex-1 min-h-0 overflow-auto px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 content-start'
              : 'flex-1 min-h-0 overflow-auto px-5 py-4 flex flex-col gap-4'
          }
        >
          <div className="flex flex-col gap-4">
            <DetailsCard {...state} />
            <PaymentForm {...state} />
          </div>

          {showPreview && (
            <div className="flex flex-col gap-4">
              <SummaryCard {...state} />
              <PaymentMirrorCard {...state} />
              <InvoiceCard {...state} />
            </div>
          )}
        </Sheet.Content>

        <Sheet.Footer>
          <Sheet.Close asChild>
            <Button variant="secondary">{t('Cancel')}</Button>
          </Sheet.Close>
          <Button
            onClick={onSubmit}
            disabled={!customerId || !planId || granting}
          >
            {granting && <Spinner />}
            {isExtending ? t('Extend') : t('Create')}
          </Button>
        </Sheet.Footer>
      </Sheet.View>
    </Sheet>
  );
};
