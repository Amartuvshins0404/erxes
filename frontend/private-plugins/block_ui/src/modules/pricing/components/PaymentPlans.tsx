import { InfoCard, InfoCardContent } from '@/block/components/card';
import { Label, Button, Input, CurrencyField, Spinner } from 'erxes-ui';
import { IconTrash } from '@tabler/icons-react';
import { usePaymentPlansByProject } from '../hooks/usePaymentPlans';
import { IPaymentPlan } from '../types/paymentPlanTypes';
import { useState } from 'react';
import {
  useRemovePaymentPlan,
  useUpdatePaymentPlan,
} from '../hooks/useManagePaymentPlan';
import { PaymentPlansAdd } from './PaymentPlansAdd';
import { SelectPaymentPlanFrequency } from '@/pricing/components/SelectPaymentPlanFrequency';
import { useParams } from 'react-router-dom';
import { SelectPaymentPlanType } from '@/pricing/components/SelectPaymentPlanType';

export const PaymentPlans = () => {
  const { paymentPlans, loading } = usePaymentPlansByProject();

  return (
    <InfoCard
      title="PAYMENT PLANS"
      description="Payment plans"
      className="col-span-2"
    >
      <InfoCardContent className='space-y-3'>
        <div className="grid grid-cols-12 gap-3">
          <div className="blk:col-span-11 grid blk:grid-cols-9 gap-3 px-2">
            <Label asChild>
              <div className="col-span-2">Plan Name</div>
            </Label>
            <Label asChild>
              <div>Type</div>
            </Label>
            <Label asChild>
              <div>Down Payment</div>
            </Label>
            <Label asChild>
              <div>Completion</div>
            </Label>
            <Label asChild>
              <div>Interest</div>
            </Label>
            <Label asChild>
              <div>Discount</div>
            </Label>
            <Label asChild>
              <div>Frequency</div>
            </Label>
            <Label asChild>
              <div>Installment</div>
            </Label>
          </div>
          <div className="px-2">
            <Label asChild>
              <div>Actions</div>
            </Label>
          </div>
        </div>
        {loading ? (
          <Spinner containerClassName="py-32" />
        ) : (
          <div className='space-y-2'>
            {paymentPlans?.map((paymentPlan) => (
              <PaymentPlanItem key={paymentPlan._id} paymentPlan={paymentPlan} />
            ))}
          </div>
        )}

        <PaymentPlansAdd />
      </InfoCardContent>
    </InfoCard>
  );
};

export const PaymentPlanItem = ({
  paymentPlan,
}: {
  paymentPlan: IPaymentPlan;
}) => {
  const { id: projectId } = useParams();
  const [paymentPlanValue, setPaymentPlanValue] = useState(paymentPlan);
  const updatePaymentPlan = useUpdatePaymentPlan();

  const handleChange = (field: keyof IPaymentPlan, value: number | string) => {
    setPaymentPlanValue({ ...paymentPlanValue, [field]: value });
  };

  const handleUpdate = (update: IPaymentPlan) => {
    const {
      _id,
      downPaymentPercentage,
      completionPaymentPercentage,
      interestPercentage,
      discountPercentage,
      name,
      frequency,
      installment,
      type,
    } = update;

    updatePaymentPlan({
      id: _id,
      input: {
        type,
        downPaymentPercentage,
        completionPaymentPercentage,
        interestPercentage,
        project: projectId,
        discountPercentage,
        frequency,
        installment,
        name,
      },
    });
  };

  const handleBlur = () => handleUpdate(paymentPlanValue);

  const handleSelect = (update: Partial<IPaymentPlan>) => {
    const isDifferent = Object.keys(update).some(
      (key) =>
        update[key as keyof IPaymentPlan] !==
        paymentPlan[key as keyof IPaymentPlan],
    );

    if (isDifferent) {
      setPaymentPlanValue({ ...paymentPlanValue, ...update });
      handleUpdate({ ...paymentPlanValue, ...update });
    }
  };

  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="blk:col-span-11 grid blk:grid-cols-9 gap-3">
        <Input
          value={paymentPlanValue.name}
          onBlur={handleBlur}
          onChange={(e) => handleChange('name', e.target.value)}
          className="col-span-2"
        />
        <SelectPaymentPlanType
          value={paymentPlanValue.type}
          onValueChange={(value) => handleSelect({ type: value })}
        />
        <CurrencyField.ValueInput
          value={paymentPlanValue.downPaymentPercentage}
          onBlur={handleBlur}
          onChange={(value) => handleChange('downPaymentPercentage', value)}
        />
        <CurrencyField.ValueInput
          value={paymentPlanValue.completionPaymentPercentage}
          onBlur={handleBlur}
          onChange={(value) => handleChange('completionPaymentPercentage', value)}
        />
        <CurrencyField.ValueInput
          value={paymentPlanValue.interestPercentage}
          onBlur={handleBlur}
          onChange={(value) => handleChange('interestPercentage', value)}
        />
        <CurrencyField.ValueInput
          value={paymentPlanValue.discountPercentage}
          onBlur={handleBlur}
          onChange={(value) => handleChange('discountPercentage', value)}
        />
        <SelectPaymentPlanFrequency
          value={paymentPlanValue.frequency}
          onValueChange={(value) => handleSelect({ frequency: value })}
        />
        <CurrencyField.ValueInput
          value={paymentPlanValue.installment}
          onBlur={handleBlur}
          onChange={(value) => handleChange('installment', value)}
        />
      </div>
      <div className="flex gap-3 items-center">
        <PaymentPlanRemove paymentPlan={paymentPlanValue} />
      </div>
    </div>
  );
};

export const PaymentPlanRemove = ({
  paymentPlan,
}: {
  paymentPlan: IPaymentPlan;
}) => {
  const removePaymentPlan = useRemovePaymentPlan();

  const handleRemove = () => {
    removePaymentPlan({ id: paymentPlan._id });
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      className="bg-destructive/10 text-destructive hover:bg-destructive/20"
      onClick={handleRemove}
    >
      <IconTrash />
    </Button>
  );
};
