import { IconPlus } from '@tabler/icons-react';
import {
  Button,
  Form,
  Input,
  Sheet,
  Slider,
  Spinner,
  Textarea,
} from 'erxes-ui';
import { useState } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentPlanSchema } from '../constants/paymentPlanSchema';
import { IPaymentPlan } from '@/pricing/types/paymentPlanTypes';
import { SelectPaymentPlanType } from './SelectPaymentPlanType';
import { useCreatePaymentPlan } from '@/pricing/hooks/useManagePaymentPlan';
import { PAYMENT_PLAN_TYPE } from '@/pricing/constants/paymentPlans';
import { SelectPaymentPlanFrequency } from '@/pricing/components/SelectPaymentPlanFrequency';

export const PaymentPlansAdd = () => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button variant="secondary">
          <IconPlus />
          Add payment plan
        </Button>
      </Sheet.Trigger>
      <Sheet.View>
        <Sheet.Header>
          <Sheet.Title>Add payment plan</Sheet.Title>
          <Sheet.Description className="sr-only">
            Add a new payment plan to the project
          </Sheet.Description>
          <Sheet.Close />
        </Sheet.Header>
        <PaymentPlansAddForm onClose={() => setOpen(false)} />
      </Sheet.View>
    </Sheet>
  );
};

export const PaymentPlansAddForm = ({ onClose }: { onClose: () => void }) => {
  const form = useForm<IPaymentPlan>({
    resolver: zodResolver(paymentPlanSchema),
    defaultValues: {
      completionPaymentPercentage: 0,
      description: '',
      name: '',
      type: PAYMENT_PLAN_TYPE.SALE,
      discountPercentage: 0,
      downPaymentPercentage: 0,
      interestPercentage: 0,
    },
  });
  const { createPaymentPlan, loading } = useCreatePaymentPlan();

  const onSubmit = (data: IPaymentPlan) => {
    createPaymentPlan({
      variables: { input: data },
      onCompleted: () => {
        onClose();
        form.reset();
      },
    });
  };

  return (
    <Form {...form}>
      <form
        className="flex-auto flex flex-col"
        onSubmit={form.handleSubmit(onSubmit, (error) => {
          console.log(error);
        })}
      >
        <Sheet.Content className="p-6 blk:space-y-5">
          <Form.Field
            name="name"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Name</Form.Label>
                <Form.Control>
                  <Input {...field} />
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />
          <Form.Field
            name="description"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Description</Form.Label>
                <Form.Control>
                  <Textarea {...field} />
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />
          <Form.Field
            name="type"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Type</Form.Label>
                <SelectPaymentPlanType
                  value={field.value}
                  onValueChange={field.onChange}
                  inForm
                />
                <Form.Message />
              </Form.Item>
            )}
          />
          <Form.Field
            name="discountPercentage"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Discount Percentage</Form.Label>
                <div className="flex gap-2 font-medium">
                  <Form.Control>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </Form.Control>
                  <div className="text-right w-6 text-sm">{field.value}%</div>
                </div>
                <Form.Description></Form.Description>
                <Form.Message />
              </Form.Item>
            )}
          />
          <Form.Field
            name="downPaymentPercentage"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Down Payment Percentage</Form.Label>
                <div className="flex gap-2 font-medium">
                  <Form.Control>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </Form.Control>
                  <div className="text-right w-6 text-sm">{field.value}%</div>
                </div>
                <Form.Description></Form.Description>
                <Form.Message />
              </Form.Item>
            )}
          />
          <Form.Field
            name="completionPaymentPercentage"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Completion Payment %</Form.Label>
                <div className="flex gap-2 font-medium">
                  <Form.Control>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </Form.Control>
                  <div className="text-right w-6 text-sm">{field.value}%</div>
                </div>
                <Form.Message />
              </Form.Item>
            )}
          />
          <Form.Field
            name="interestPercentage"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Interest Percentage</Form.Label>
                <div className="flex gap-2 font-medium">
                  <Form.Control>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </Form.Control>
                  <div className="text-right w-6 text-sm">{field.value}%</div>
                </div>
                <Form.Message />
              </Form.Item>
            )}
          />
          <Form.Field
            name="frequency"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Frequency</Form.Label>
                <SelectPaymentPlanFrequency
                  value={field.value}
                  onValueChange={field.onChange}
                />
                <Form.Description></Form.Description>
                <Form.Message />
              </Form.Item>
            )}
          />

          <Form.Field
            name="installment"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Installment</Form.Label>
                <Form.Control>
                  <Input
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number(e.target.value || '0'))
                    }
                  />
                </Form.Control>
              </Form.Item>
            )}
          />
        </Sheet.Content>
        <Sheet.Footer>
          <Sheet.Close asChild>
            <Button variant="secondary" className="bg-border">
              Cancel
            </Button>
          </Sheet.Close>
          <Button type="submit" disabled={loading}>
            <Spinner show={loading} />
            Add payment plan
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};
