import {
  Button,
  Dialog,
  Form,
  Input,
  Select,
  Spinner,
  Textarea,
} from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { SelectOneFitCustomer } from '~/modules/onefitCustomer/components/SelectOneFitCustomer';
import { useCreateCreditTransaction } from '../hooks/useCreditMutations';
import {
  OneFitCreditTransactionType,
  OneFitCreditSource,
} from '../types/credit';
import { ONE_FIT_ACTIVE_MEMBERSHIP_PLANS } from '~/modules/membership/graphql/membershipPlanQueries';
import { OneFitMembershipPlan } from '~/modules/membership/types/membership';

const createCreditTransactionSchema = z
  .object({
    userId: z.string().min(1, { message: 'User ID is required' }),
    transactionType: z.nativeEnum(OneFitCreditTransactionType, {
      required_error: 'Transaction type is required',
    }),
    amount: z.number().refine((val) => val !== 0, {
      message: 'Amount cannot be zero',
    }),
    source: z.nativeEnum(OneFitCreditSource).optional(),
    description: z.string().optional(),
    bookingId: z.string().optional(),
    corporateCreditId: z.string().optional(),
    membershipPlanId: z.string().optional(),
  })
  .refine(
    (data) => {
      // Amount sign validation
      const isPositive =
        data.transactionType === OneFitCreditTransactionType.PURCHASE ||
        data.transactionType === OneFitCreditTransactionType.REFUND;
      const isNegative =
        data.transactionType === OneFitCreditTransactionType.USAGE ||
        data.transactionType === OneFitCreditTransactionType.EXPIRATION;

      if (isPositive && data.amount <= 0) {
        return false;
      }
      if (isNegative && data.amount >= 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Amount sign does not match transaction type',
      path: ['amount'],
    },
  )
  .refine(
    (data) => {
      // For USAGE and REFUND with corporate source, corporateCreditId is required
      if (
        (data.transactionType === OneFitCreditTransactionType.USAGE ||
          data.transactionType === OneFitCreditTransactionType.REFUND) &&
        data.source === OneFitCreditSource.CORPORATE
      ) {
        return (
          data.corporateCreditId !== undefined &&
          data.corporateCreditId !== null &&
          data.corporateCreditId.trim() !== ''
        );
      }
      return true;
    },
    {
      message: 'Corporate Credit ID is required',
      path: ['corporateCreditId'],
    },
  )
  .refine(
    (data) => {
      if (
        data.transactionType === OneFitCreditTransactionType.USAGE ||
        data.transactionType === OneFitCreditTransactionType.REFUND
      ) {
        return (
          data.bookingId !== undefined &&
          data.bookingId !== null &&
          data.bookingId.trim() !== ''
        );
      }
      return true;
    },
    {
      message: 'Booking ID is required for usage and refund transactions',
      path: ['bookingId'],
    },
  )
  .refine(
    (data) => {
      if (
        data.transactionType === OneFitCreditTransactionType.USAGE ||
        data.transactionType === OneFitCreditTransactionType.REFUND
      ) {
        return data.source !== undefined;
      }
      return true;
    },
    {
      message: 'Source is required',
      path: ['source'],
    },
  )
  .refine(
    (data) => {
      if (data.transactionType === OneFitCreditTransactionType.PURCHASE) {
        return (
          data.membershipPlanId !== undefined &&
          data.membershipPlanId !== null &&
          data.membershipPlanId.trim() !== ''
        );
      }
      return true;
    },
    {
      message: 'Membership Plan is required for purchase transactions',
      path: ['membershipPlanId'],
    },
  );

type CreateCreditTransactionFormData = z.infer<
  typeof createCreditTransactionSchema
>;

export const CreateCreditTransactionDialog = () => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>
          <IconPlus />
          Add Credit Transaction
        </Button>
      </Dialog.Trigger>
      <Dialog.Content className="max-w-2xl">
        <Dialog.Header>
          <Dialog.Title>Create Credit Transaction</Dialog.Title>
        </Dialog.Header>
        <CreateCreditTransactionForm
          onClose={() => {
            setOpen(false);
          }}
        />
      </Dialog.Content>
    </Dialog>
  );
};

const CreateCreditTransactionForm = ({ onClose }: { onClose: () => void }) => {
  const form = useForm<CreateCreditTransactionFormData>({
    resolver: zodResolver(createCreditTransactionSchema),
    defaultValues: {
      userId: '',
      amount: 0,
      transactionType: undefined,
      source: undefined,
      description: '',
      bookingId: '',
      corporateCreditId: '',
      membershipPlanId: '',
    },
  });
  const { createCreditTransaction, loading } = useCreateCreditTransaction();

  const { data: membershipPlansData } = useQuery(
    ONE_FIT_ACTIVE_MEMBERSHIP_PLANS,
  );
  const membershipPlans =
    membershipPlansData?.oneFitActiveMembershipPlans || [];

  const transactionType = form.watch('transactionType');
  const source = form.watch('source');
  const membershipPlanId = form.watch('membershipPlanId');

  // Auto-populate amount when membership plan is selected for purchase
  useEffect(() => {
    if (
      transactionType === OneFitCreditTransactionType.PURCHASE &&
      membershipPlanId
    ) {
      const selectedPlan = membershipPlans.find(
        (plan: OneFitMembershipPlan) => plan._id === membershipPlanId,
      );
      if (selectedPlan) {
        form.setValue('amount', selectedPlan.creditAmount);
      }
    }
  }, [membershipPlanId, transactionType, membershipPlans, form]);

  // Clear fields when transaction type changes
  useEffect(() => {
    if (transactionType) {
      // Reset amount to ensure correct sign
      const currentAmount = form.getValues('amount');
      const isPositive =
        transactionType === OneFitCreditTransactionType.PURCHASE ||
        transactionType === OneFitCreditTransactionType.REFUND;
      const isNegative =
        transactionType === OneFitCreditTransactionType.USAGE ||
        transactionType === OneFitCreditTransactionType.EXPIRATION;

      if (isPositive && currentAmount < 0) {
        form.setValue('amount', Math.abs(currentAmount));
      } else if (isNegative && currentAmount > 0) {
        form.setValue('amount', -currentAmount);
      }

      // Reset optional fields when type changes
      if (
        transactionType !== OneFitCreditTransactionType.USAGE &&
        transactionType !== OneFitCreditTransactionType.REFUND
      ) {
        form.setValue('bookingId', '');
      }
      if (
        transactionType !== OneFitCreditTransactionType.USAGE &&
        transactionType !== OneFitCreditTransactionType.REFUND
      ) {
        form.setValue('corporateCreditId', '');
      }
      if (transactionType !== OneFitCreditTransactionType.PURCHASE) {
        form.setValue('membershipPlanId', '');
      }
    }
  }, [transactionType, form]);

  const onSubmit = (data: CreateCreditTransactionFormData) => {
    // Determine source based on transaction type
    let finalSource = data.source;
    if (
      data.transactionType === OneFitCreditTransactionType.PURCHASE ||
      data.transactionType === OneFitCreditTransactionType.EXPIRATION
    ) {
      finalSource = OneFitCreditSource.INDIVIDUAL;
    }

    createCreditTransaction({
      variables: {
        userId: data.userId,
        amount: data.amount,
        transactionType: data.transactionType,
        source: finalSource!,
        description: data.description?.trim() || undefined,
        bookingId: data.bookingId?.trim() || undefined,
        corporateCreditId: data.corporateCreditId?.trim() || undefined,
        membershipPlanId: data.membershipPlanId?.trim() || undefined,
      },
      onCompleted: () => {
        onClose();
        form.reset();
      },
    });
  };

  const showSourceField =
    transactionType === OneFitCreditTransactionType.USAGE ||
    transactionType === OneFitCreditTransactionType.REFUND;

  const showBookingIdField =
    transactionType === OneFitCreditTransactionType.USAGE ||
    transactionType === OneFitCreditTransactionType.REFUND;

  const showCorporateCreditIdField =
    (transactionType === OneFitCreditTransactionType.USAGE &&
      source === OneFitCreditSource.CORPORATE) ||
    (transactionType === OneFitCreditTransactionType.REFUND &&
      source === OneFitCreditSource.CORPORATE);

  const isAmountPositive =
    transactionType === OneFitCreditTransactionType.PURCHASE ||
    transactionType === OneFitCreditTransactionType.REFUND;

  const isAmountNegative =
    transactionType === OneFitCreditTransactionType.USAGE ||
    transactionType === OneFitCreditTransactionType.EXPIRATION;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <Form.Field
          control={form.control}
          name="transactionType"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Transaction Type *</Form.Label>
              <Form.Control>
                <Select value={field.value} onValueChange={field.onChange}>
                  <Select.Trigger>
                    <Select.Value placeholder="Select transaction type" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item
                      value={OneFitCreditTransactionType.PURCHASE}
                      disabled
                    >
                      Purchase
                    </Select.Item>
                    <Select.Item value={OneFitCreditTransactionType.USAGE}>
                      Usage
                    </Select.Item>
                    <Select.Item value={OneFitCreditTransactionType.REFUND}>
                      Refund
                    </Select.Item>
                    <Select.Item value={OneFitCreditTransactionType.EXPIRATION}>
                      Expiration
                    </Select.Item>
                  </Select.Content>
                </Select>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="userId"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Customer *</Form.Label>
              <Form.Control>
                <SelectOneFitCustomer.FormItem
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  mode="single"
                  type="erxes"
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {transactionType === OneFitCreditTransactionType.PURCHASE ? (
            <Form.Field
              control={form.control}
              name="membershipPlanId"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Membership Plan *</Form.Label>
                  <Form.Control>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <Select.Trigger>
                        <Select.Value placeholder="Select membership plan" />
                      </Select.Trigger>
                      <Select.Content>
                        {membershipPlans.map((plan: OneFitMembershipPlan) => (
                          <Select.Item key={plan._id} value={plan._id}>
                            {plan.name} ({plan.creditAmount} credits)
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
          ) : (
            <Form.Field
              control={form.control}
              name="amount"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    Amount *{' '}
                    {isAmountPositive && (
                      <span className="text-xs text-muted-foreground">
                        (positive)
                      </span>
                    )}
                    {isAmountNegative && (
                      <span className="text-xs text-muted-foreground">
                        (negative)
                      </span>
                    )}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder={
                        isAmountPositive
                          ? 'Enter positive amount'
                          : isAmountNegative
                            ? 'Enter negative amount'
                            : 'Enter amount'
                      }
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        if (inputValue === '' || inputValue === '-') {
                          field.onChange(0);
                          return;
                        }
                        const value = parseFloat(inputValue);
                        if (isNaN(value)) {
                          return;
                        }
                        // Enforce sign based on transaction type
                        if (isAmountPositive) {
                          field.onChange(Math.abs(value));
                        } else if (isAmountNegative) {
                          field.onChange(-Math.abs(value));
                        } else {
                          field.onChange(value);
                        }
                      }}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
          )}
        </div>

        {transactionType === OneFitCreditTransactionType.PURCHASE && (
          <Form.Field
            control={form.control}
            name="amount"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>
                  Amount *{' '}
                  <span className="text-xs text-muted-foreground">
                    (auto-filled from plan)
                  </span>
                </Form.Label>
                <Form.Control>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="Amount from membership plan"
                    readOnly
                    className="bg-muted"
                  />
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />
        )}

        {showSourceField && (
          <Form.Field
            control={form.control}
            name="source"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Source *</Form.Label>
                <Form.Control>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <Select.Trigger>
                      <Select.Value placeholder="Select source" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value={OneFitCreditSource.INDIVIDUAL}>
                        Individual
                      </Select.Item>
                      <Select.Item value={OneFitCreditSource.CORPORATE}>
                        Corporate
                      </Select.Item>
                    </Select.Content>
                  </Select>
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />
        )}

        {showBookingIdField && (
          <Form.Field
            control={form.control}
            name="bookingId"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Booking ID *</Form.Label>
                <Form.Control>
                  <Input {...field} placeholder="Enter booking ID" />
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />
        )}

        {showCorporateCreditIdField && (
          <Form.Field
            control={form.control}
            name="corporateCreditId"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>
                  Corporate Credit ID * (required for corporate source)
                </Form.Label>
                <Form.Control>
                  <Input {...field} placeholder="Enter corporate credit ID" />
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />
        )}

        <Form.Field
          control={form.control}
          name="description"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Description</Form.Label>
              <Form.Control>
                <Textarea {...field} placeholder="Enter description" rows={3} />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Dialog.Footer>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={loading}>
            <Spinner show={loading} />
            Create Transaction
          </Button>
        </Dialog.Footer>
      </form>
    </Form>
  );
};
