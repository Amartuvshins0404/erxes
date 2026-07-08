import { IconGift } from '@tabler/icons-react';
import { Button, Input, Label, Select, Sheet, toast } from 'erxes-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SelectCustomer } from 'ui-modules';
import { useGrantMembership } from '../hooks/useMemberActions';
import { usePlans } from '../hooks/usePlans';

export const GrantMembershipSheet = () => {
  const { t } = useTranslation('blockadmin');
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [amount, setAmount] = useState('');

  const { plans, loading: plansLoading } = usePlans(true);
  const { handleGrant, loading } = useGrantMembership();

  const reset = () => {
    setCustomerId('');
    setPlanId('');
    setAmount('');
  };

  const onSubmit = async () => {
    if (!customerId || !planId) return;
    try {
      await handleGrant(
        customerId,
        planId,
        undefined,
        amount ? Number(amount) : undefined,
      );
      toast({ title: t('Membership granted') });
      reset();
      setOpen(false);
    } catch (e: any) {
      toast({
        title: t('Error'),
        description: e.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <Sheet.Trigger asChild>
        <Button>
          <IconGift />
          {t('Grant membership')}
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 sm:max-w-md">
        <Sheet.Header>
          <Sheet.Title>{t('Grant membership')}</Sheet.Title>
        </Sheet.Header>
        <Sheet.Content className="flex flex-col gap-4 p-4">
          <div className="space-y-1.5">
            <Label className="font-medium text-sm">{t('Customer')}</Label>
            <SelectCustomer
              mode="single"
              value={customerId}
              onValueChange={(v) =>
                setCustomerId(Array.isArray(v) ? v[0] || '' : v)
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-medium text-sm">{t('Plan')}</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <Select.Trigger className="w-full">
                <Select.Value
                  placeholder={
                    plansLoading ? t('Loading plans…') : t('Select a plan')
                  }
                />
              </Select.Trigger>
              <Select.Content>
                {plans.map((plan) => (
                  <Select.Item key={plan._id} value={plan._id}>
                    {plan.name} · {plan.durationMonths ?? '-'} {t('months')} ·{' '}
                    {plan.price.toLocaleString()} {plan.currency || 'MNT'}
                  </Select.Item>
                ))}
                {!plansLoading && plans.length === 0 && (
                  <div className="px-2 py-1.5 text-muted-foreground text-sm">
                    {t('No active plans')}
                  </div>
                )}
              </Select.Content>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="font-medium text-sm">
              {t('Amount (optional)')}
            </Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('Defaults to plan price')}
            />
          </div>
        </Sheet.Content>
        <Sheet.Footer className="border-t p-4">
          <Sheet.Close asChild>
            <Button variant="secondary">{t('Cancel')}</Button>
          </Sheet.Close>
          <Button
            disabled={!customerId || !planId || loading}
            onClick={onSubmit}
          >
            {t('Grant')}
          </Button>
        </Sheet.Footer>
      </Sheet.View>
    </Sheet>
  );
};
