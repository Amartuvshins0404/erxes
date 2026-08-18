import { useQuery } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconPlus } from '@tabler/icons-react';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Label,
  Select,
  Sheet,
  Spinner,
} from 'erxes-ui';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ONE_FIT_ACTIVE_MEMBERSHIP_PLANS,
  ONE_FIT_MEMBERSHIP_PLAN,
} from '~/modules/membership/graphql/membershipPlanQueries';
import { OneFitMembershipPlan } from '~/modules/membership/types/membership';
import { ONE_FIT_CUSTOMER } from '~/modules/onefitCustomer/graphql/onefitCustomerQueries';
import { SelectOneFitCustomer } from '~/modules/onefitCustomer/components/SelectOneFitCustomer';
import { useCreateMembershipPurchase } from '../hooks/useMembershipPurchaseMutations';

const DEFAULT_QUANTITY_VALUE = '__default_quantity__';

const createMembershipPurchaseSchema = z.object({
  userId: z.string().min(1, { message: 'Customer is required' }),
  planId: z.string().min(1, { message: 'Membership plan is required' }),
  quantity: z
    .number()
    .int()
    .min(1, { message: 'Quantity must be at least 1' })
    .optional(),
  promoCode: z.string().optional(),
  removePreviousCredits: z.boolean().optional(),
});

type CreateMembershipPurchaseFormData = z.infer<
  typeof createMembershipPurchaseSchema
>;

interface CreateMembershipPurchaseDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultUserId?: string;
}

export function CreateMembershipPurchaseDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultUserId,
}: CreateMembershipPurchaseDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? (controlledOpen as boolean) : internalOpen;
  const setOpen = isControlled
    ? (nextOpen: boolean) => controlledOnOpenChange?.(nextOpen)
    : setInternalOpen;

  const form = useForm<CreateMembershipPurchaseFormData>({
    resolver: zodResolver(createMembershipPurchaseSchema),
    defaultValues: {
      userId: defaultUserId || '',
      planId: '',
      quantity: undefined,
      promoCode: '',
      removePreviousCredits: false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        userId: defaultUserId || '',
        planId: '',
        quantity: undefined,
        promoCode: '',
        removePreviousCredits: false,
      });
    }
  }, [defaultUserId, form, open]);

  const { data } = useQuery(ONE_FIT_ACTIVE_MEMBERSHIP_PLANS);
  const plans: OneFitMembershipPlan[] = data?.oneFitActiveMembershipPlans || [];

  const planId = form.watch('planId');
  const selectedPlan = useMemo(() => {
    if (!planId) return undefined;
    return plans.find((p) => p._id === planId);
  }, [planId, plans]);
  const availableSaleQuantities = useMemo(() => {
    const options = selectedPlan?.saleOptions ?? [];
    const quantities = options
      .map((option) => option.quantity)
      .filter((value) => Number.isInteger(value) && value >= 1);

    return Array.from(new Set(quantities)).sort((a, b) => a - b);
  }, [selectedPlan]);

  const userId = form.watch('userId');
  const { data: customerData, loading: customerLoading } = useQuery(
    ONE_FIT_CUSTOMER,
    {
      variables: { _id: userId },
      skip: !userId,
    },
  );
  const oneFitCustomer = customerData?.oneFitCustomer;
  const currentPlanId = oneFitCustomer?.oneFitMembershipPlanId;
  const { data: currentPlanData } = useQuery(ONE_FIT_MEMBERSHIP_PLAN, {
    variables: { _id: currentPlanId || '' },
    skip: !currentPlanId,
  });
  const currentPlanName = currentPlanId
    ? currentPlanData?.oneFitMembershipPlan?.name ?? '…'
    : 'None';

  const creditBalance = oneFitCustomer?.oneFitCurrentCreditBalance ?? 0;
  const canClearCredits = creditBalance > 0;

  useEffect(() => {
    if (!canClearCredits && form.getValues('removePreviousCredits')) {
      form.setValue('removePreviousCredits', false);
    }
  }, [canClearCredits, form]);

  const { createMembershipPurchase, loading } = useCreateMembershipPurchase();

  function handleClose() {
    setOpen(false);
    form.reset({
      userId: defaultUserId || '',
      planId: '',
      quantity: undefined,
      promoCode: '',
      removePreviousCredits: false,
    });
  }

  const selectedQuantity = form.watch('quantity');
  const quantity = selectedQuantity ?? 1;
  const hasSaleOptions = availableSaleQuantities.length > 0;

  useEffect(() => {
    if (!selectedPlan) {
      return;
    }

    if (!availableSaleQuantities.length) {
      form.setValue('quantity', 1);
      return;
    }

    if (
      selectedQuantity !== undefined &&
      !availableSaleQuantities.includes(selectedQuantity)
    ) {
      form.setValue('quantity', undefined);
    }
  }, [selectedPlan, availableSaleQuantities, selectedQuantity, form]);

  function onSubmit(values: CreateMembershipPurchaseFormData) {
    createMembershipPurchase({
      variables: {
        userId: values.userId,
        planId: values.planId,
        ...(values.quantity ? { quantity: values.quantity } : {}),
        ...(values.promoCode?.trim() && { promoCode: values.promoCode.trim() }),
        ...(values.removePreviousCredits &&
          canClearCredits && { removePreviousCredits: true }),
      },
      onCompleted: () => handleClose(),
    });
  }
  const tierPrice = useMemo(() => {
    if (!selectedPlan) {
      return 0;
    }

    if (quantity <= 1) {
      return selectedPlan.price;
    }

    const tier = selectedPlan.saleOptions?.find(
      (option) => option.quantity === quantity,
    );
    if (!tier) {
      return selectedPlan.price;
    }

    if (tier.finalPrice != null) {
      return tier.finalPrice;
    }

    if (tier.discountPercent != null) {
      return Math.max(0, selectedPlan.price * (1 - tier.discountPercent / 100));
    }

    return selectedPlan.price;
  }, [quantity, selectedPlan]);

  const hasTier = Boolean(
    selectedPlan?.saleOptions?.some((option) => option.quantity === quantity),
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!isControlled && trigger && (
        <Sheet.Trigger asChild>{trigger}</Sheet.Trigger>
      )}
      {!isControlled && !trigger && (
        <Sheet.Trigger asChild>
          <Button>
            <IconPlus />
            Create purchase
          </Button>
        </Sheet.Trigger>
      )}
      <Sheet.View className="h-full sm:max-w-2xl">
        <Sheet.Header className="h-auto min-h-14 items-start gap-3 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 pr-2">
            <Sheet.Title>Create membership purchase</Sheet.Title>
            <Sheet.Description className="mt-0">
              This will create a purchase and generate a payment invoice.
            </Sheet.Description>
          </div>
          <Sheet.Close className="shrink-0" />
        </Sheet.Header>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex h-full flex-col overflow-hidden"
          >
            <Sheet.Content className="flex-auto overflow-y-auto">
              <div className="flex flex-col gap-6 p-5">
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

                {userId ? (
                  <div className="rounded-lg border bg-muted/20 p-4 text-sm space-y-2">
                    <div className="font-medium">Current membership</div>
                    {customerLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Spinner show />
                        Loading customer…
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-muted-foreground">Plan</div>
                          <div className="font-medium">{currentPlanName}</div>
                          <div className="text-muted-foreground">Credits</div>
                          <div className="font-medium">{creditBalance}</div>
                          {oneFitCustomer?.oneFitMembershipStatus ? (
                            <>
                              <div className="text-muted-foreground">
                                Status
                              </div>
                              <div className="font-medium">
                                {oneFitCustomer.oneFitMembershipStatus}
                              </div>
                            </>
                          ) : null}
                          {oneFitCustomer?.oneFitMembershipExpiresAt ? (
                            <>
                              <div className="text-muted-foreground">
                                Expires
                              </div>
                              <div className="font-medium">
                                {new Date(
                                  oneFitCustomer.oneFitMembershipExpiresAt,
                                ).toLocaleString()}
                              </div>
                            </>
                          ) : null}
                        </div>
                        <Form.Field
                          control={form.control}
                          name="removePreviousCredits"
                          render={({ field }) => (
                            <Form.Item className="flex flex-row items-start gap-2 pt-2 border-t mt-2">
                              <Checkbox
                                checked={Boolean(field.value)}
                                onCheckedChange={(v) =>
                                  field.onChange(v === true)
                                }
                                disabled={!canClearCredits}
                              />
                              <div className="space-y-1">
                                <Label className="font-normal leading-snug cursor-pointer">
                                  When this purchase is activated, clear
                                  existing credits first, then grant this
                                  plan&apos;s credits.
                                </Label>
                                {!canClearCredits ? (
                                  <p className="text-xs text-muted-foreground">
                                    No credits to clear.
                                  </p>
                                ) : null}
                                <Form.Message />
                              </div>
                            </Form.Item>
                          )}
                        />
                      </>
                    )}
                  </div>
                ) : null}

                <Form.Field
                  control={form.control}
                  name="planId"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Membership plan *</Form.Label>
                      <Form.Control>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <Select.Trigger>
                            <Select.Value placeholder="Select membership plan" />
                          </Select.Trigger>
                          <Select.Content>
                            {plans.map((plan) => (
                              <Select.Item key={plan._id} value={plan._id}>
                                {plan.name}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Quantity</Form.Label>
                      <Form.Control>
                        <Select
                          value={
                            field.value
                              ? String(field.value)
                              : DEFAULT_QUANTITY_VALUE
                          }
                          onValueChange={(value) =>
                            field.onChange(
                              value === DEFAULT_QUANTITY_VALUE
                                ? undefined
                                : parseInt(value, 10),
                            )
                          }
                          disabled={!selectedPlan || !hasSaleOptions}
                        >
                          <Select.Trigger>
                            <Select.Value placeholder="Default (1)" />
                          </Select.Trigger>
                          <Select.Content>
                            {hasSaleOptions ? (
                              <>
                                <Select.Item value={DEFAULT_QUANTITY_VALUE}>
                                  Default (1)
                                </Select.Item>
                                {availableSaleQuantities.map((saleQuantity) => (
                                  <Select.Item
                                    key={saleQuantity}
                                    value={String(saleQuantity)}
                                  >
                                    {saleQuantity}
                                  </Select.Item>
                                ))}
                              </>
                            ) : (
                              <Select.Item value="1">1</Select.Item>
                            )}
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      {selectedPlan && !hasSaleOptions ? (
                        <p className="text-xs text-muted-foreground">
                          This plan has no configured sale quantities. Quantity
                          is fixed to 1.
                        </p>
                      ) : null}
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="promoCode"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Promo code</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          placeholder="Enter promo code (optional)"
                          value={field.value ?? ''}
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                {selectedPlan && (
                  <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                    <div className="mb-2 font-medium">Summary</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-muted-foreground">Price</div>
                      <div className="font-medium">
                        {tierPrice.toLocaleString()} MNT
                      </div>
                      <div className="text-muted-foreground">Quantity</div>
                      <div className="font-medium">{quantity}</div>
                      {hasTier && quantity > 1 ? (
                        <>
                          <div className="col-span-2 text-muted-foreground">
                            Tiered sale option applied
                          </div>
                        </>
                      ) : null}
                      {form.watch('promoCode')?.trim() && (
                        <>
                          <div className="col-span-2 text-muted-foreground">
                            Promo will be applied at checkout
                          </div>
                        </>
                      )}
                      <div className="text-muted-foreground">Credits</div>
                      <div className="font-medium">
                        {selectedPlan.creditAmount}
                      </div>
                      <div className="text-muted-foreground">Duration</div>
                      <div className="font-medium">
                        {selectedPlan.duration} days
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Sheet.Content>
            <Sheet.Footer className="flex shrink-0 justify-end gap-2 bg-muted p-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Spinner show={loading} />
                Create invoice
              </Button>
            </Sheet.Footer>
          </form>
        </Form>
      </Sheet.View>
    </Sheet>
  );
}
