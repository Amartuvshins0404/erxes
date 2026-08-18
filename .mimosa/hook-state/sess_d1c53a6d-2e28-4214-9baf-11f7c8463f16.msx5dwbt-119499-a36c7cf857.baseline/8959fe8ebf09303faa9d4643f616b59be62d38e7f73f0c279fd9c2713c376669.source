import { Combobox, Command, Popover } from 'erxes-ui';
import { OfferFormData } from '@/offer/constants/offerSchema';
import { usePaymentPlansByProject } from '@/pricing/hooks/usePaymentPlans';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

export const SelectPaymentPlan = ({
  value,
  onValueChange,
  form,
}: {
  value: string;
  onValueChange?: (value: string) => void;
  form: UseFormReturn<OfferFormData>;
}) => {
  const [open, setOpen] = useState(false);
  const { paymentPlans, loading, error } = usePaymentPlansByProject();

  const handleValueChange = (value: string) => {
    setOpen(false);
    if (onValueChange) {
      onValueChange(value);
    }
    const paymentPlan = paymentPlans?.find(
      (paymentPlan) => paymentPlan._id === value,
    );
    if (!paymentPlan) return;
    form.setValue('paymentPlan', {
      type: paymentPlan.type,
      downPaymentPercentage: paymentPlan.downPaymentPercentage,
      interestPercentage: paymentPlan.interestPercentage,
      discountPercentage: paymentPlan.discountPercentage,
      installment: paymentPlan.installment,
      frequency: paymentPlan.frequency,
    });
  };

  const selectedPaymentPlan = paymentPlans?.find(
    (paymentPlan) => paymentPlan._id === value,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Combobox.Trigger>
        <Combobox.Value value={selectedPaymentPlan?.name} />
      </Combobox.Trigger>
      <Combobox.Content>
        <Command>
          <Command.Input />
          <Command.List>
            <Combobox.Empty loading={loading} error={error} />
            {paymentPlans?.map((paymentPlan) => (
              <Command.Item
                key={paymentPlan._id}
                value={paymentPlan._id}
                className="h-auto"
                onSelect={() => handleValueChange(paymentPlan._id)}
              >
                <div className="flex flex-col gap-1">
                  {paymentPlan.name}
                  <span className="text-sm text-muted-foreground">
                    {paymentPlan.description}
                  </span>
                </div>
                <Combobox.Check checked={paymentPlan._id === value} />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};
