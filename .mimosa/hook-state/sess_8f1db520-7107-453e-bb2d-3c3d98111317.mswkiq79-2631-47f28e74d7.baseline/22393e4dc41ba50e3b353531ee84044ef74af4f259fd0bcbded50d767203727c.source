import { useQuery } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Select,
  Sheet,
  Spinner,
  toast,
} from 'erxes-ui';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ONE_FIT_CUSTOMERS_BY_COMPANY_ID } from '~/modules/credit/graphql/companyQueries';
import { SelectCompany } from '~/modules/credit/components/SelectCompany';
import { ONE_FIT_ACTIVE_MEMBERSHIP_PLANS } from '~/modules/membership/graphql/membershipPlanQueries';
import { OneFitMembershipPlan } from '~/modules/membership/types/membership';
import { SelectOneFitCustomer } from '~/modules/onefitCustomer/components/SelectOneFitCustomer';
import { useBulkCreateMembershipPurchases } from '../hooks/useMembershipPurchaseMutations';

const DEFAULT_QUANTITY_VALUE = '__default_quantity__';

const bulkMembershipPurchaseSchema = z
  .object({
    companyId: z.string().optional(),
    registerCompanyType: z.enum(['b2b', 'b2c']),
    userIds: z
      .array(z.string())
      .min(1, { message: 'Select at least one customer' }),
    planId: z.string().min(1, { message: 'Membership plan is required' }),
    quantity: z
      .number()
      .int()
      .min(1, { message: 'Quantity must be at least 1' })
      .optional(),
    promoCode: z.string().optional(),
    removePreviousCredits: z.boolean().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.registerCompanyType === 'b2b' && !values.companyId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyId'],
        message: 'Company is required for B2B',
      });
    }
  });

type BulkMembershipPurchaseFormData = z.infer<
  typeof bulkMembershipPurchaseSchema
>;

interface IRelatedCustomer {
  _id: string;
  primaryPhone?: string;
  primaryEmail?: string;
}

interface BulkMembershipPurchaseDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function BulkMembershipPurchaseDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: BulkMembershipPurchaseDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? (controlledOpen as boolean) : internalOpen;
  const setOpen = isControlled
    ? (controlledOnOpenChange as (open: boolean) => void)
    : setInternalOpen;

  const form = useForm<BulkMembershipPurchaseFormData>({
    resolver: zodResolver(bulkMembershipPurchaseSchema),
    defaultValues: {
      companyId: '',
      registerCompanyType: 'b2b',
      userIds: [],
      planId: '',
      quantity: undefined,
      promoCode: '',
      removePreviousCredits: false,
    },
  });

  const companyId = form.watch('companyId');
  const registerCompanyType = form.watch('registerCompanyType');
  const userIds = form.watch('userIds') ?? [];
  const planId = form.watch('planId');
  const selectedQuantity = form.watch('quantity');
  const quantity = selectedQuantity ?? 1;

  const { data: customersData, loading: customersLoading } = useQuery(
    ONE_FIT_CUSTOMERS_BY_COMPANY_ID,
    {
      variables: { companyId: companyId || '' },
      skip: registerCompanyType !== 'b2b' || !companyId,
    },
  );
  const relatedCustomers: IRelatedCustomer[] =
    customersData?.oneFitCustomersByCompanyId ?? [];

  const { data: plansData } = useQuery(ONE_FIT_ACTIVE_MEMBERSHIP_PLANS);
  const plans: OneFitMembershipPlan[] =
    plansData?.oneFitActiveMembershipPlans ?? [];
  const selectedPlan = plans.find((plan) => plan._id === planId);
  const availableSaleQuantities = useMemo(() => {
    const options = selectedPlan?.saleOptions ?? [];
    const quantities = options
      .map((option) => option.quantity)
      .filter((value) => Number.isInteger(value) && value >= 1);

    return Array.from(new Set(quantities)).sort((a, b) => a - b);
  }, [selectedPlan]);

  const filteredRelatedCustomers = useMemo(() => {
    if (!customerSearch.trim()) {
      return relatedCustomers;
    }

    const term = customerSearch.trim().toLowerCase();
    return relatedCustomers.filter((customer) => {
      const phone = (customer.primaryPhone || '').toLowerCase();
      const email = (customer.primaryEmail || '').toLowerCase();
      return phone.includes(term) || email.includes(term);
    });
  }, [customerSearch, relatedCustomers]);

  const { bulkCreateMembershipPurchases, loading: submitLoading } =
    useBulkCreateMembershipPurchases();

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

  function handleClose() {
    setOpen(false);
    setCustomerSearch('');
    form.reset({
      companyId: '',
      registerCompanyType: 'b2b',
      userIds: [],
      planId: '',
      quantity: undefined,
      promoCode: '',
      removePreviousCredits: false,
    });
  }

  function toggleCustomer(customerId: string) {
    const nextUserIds = userIds.includes(customerId)
      ? userIds.filter((id) => id !== customerId)
      : [...userIds, customerId];
    form.setValue('userIds', nextUserIds);
  }

  function selectAllFilteredCustomers() {
    form.setValue(
      'userIds',
      filteredRelatedCustomers.map((customer) => customer._id),
    );
  }

  function clearCustomers() {
    form.setValue('userIds', []);
  }

  function onSubmit(values: BulkMembershipPurchaseFormData) {
    const selectedCount = values.userIds.length;
    const normalizedCompanyId = values.companyId?.trim();
    const variables: Record<string, unknown> = {
      userIds: values.userIds,
      planId: values.planId,
      ...(values.quantity ? { quantity: values.quantity } : {}),
      ...(values.promoCode?.trim() && { promoCode: values.promoCode.trim() }),
      ...(values.removePreviousCredits && { removePreviousCredits: true }),
    };

    if (values.registerCompanyType === 'b2b') {
      variables.companyId = normalizedCompanyId;
    }

    bulkCreateMembershipPurchases({
      variables,
      onCompleted: (data) => {
        const createdCount =
          (data?.oneFitMembershipPurchasesBulkCreate as unknown[])?.length ?? 0;
        const failedCount = Math.max(selectedCount - createdCount, 0);

        if (failedCount > 0) {
          toast({
            title: 'Partial success',
            description: `${createdCount} created, ${failedCount} failed`,
          });
        }

        handleClose();
      },
    });
  }

  const hasCompanyForB2B =
    registerCompanyType === 'b2c' || Boolean(companyId?.trim());
  const hasSaleOptions = availableSaleQuantities.length > 0;
  const hasValidSaleQuantity = !selectedPlan
    ? true
    : hasSaleOptions
    ? selectedQuantity === undefined ||
      availableSaleQuantities.includes(selectedQuantity)
    : quantity === 1;
  const isValid =
    hasCompanyForB2B &&
    Boolean(planId) &&
    userIds.length > 0 &&
    hasValidSaleQuantity;
  const selectedTier = selectedPlan?.saleOptions?.find(
    (option) => option.quantity === quantity,
  );
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

  const totalAmount = tierPrice * userIds.length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!isControlled && trigger && (
        <Sheet.Trigger asChild>{trigger}</Sheet.Trigger>
      )}
      <Sheet.View className="sm:max-w-2xl h-full">
        <Sheet.Header className="h-auto min-h-14 items-start gap-3 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 pr-2">
            <Sheet.Title>Bulk membership purchase</Sheet.Title>
            <Sheet.Description className="mt-0">
              Select one company, then choose related customers to create
              membership purchases.
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
                  name="registerCompanyType"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Which company to register</Form.Label>
                      <Form.Control>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('userIds', []);
                            form.setValue('companyId', '');
                            setCustomerSearch('');
                          }}
                        >
                          <Select.Trigger>
                            <Select.Value placeholder="Select registration type" />
                          </Select.Trigger>
                          <Select.Content>
                            <Select.Item value="b2b">B2B</Select.Item>
                            <Select.Item value="b2c">B2C</Select.Item>
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                {registerCompanyType === 'b2b' && (
                  <Form.Field
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Company *</Form.Label>
                        <Form.Control>
                          <SelectCompany
                            value={field.value ?? ''}
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue('userIds', []);
                              setCustomerSearch('');
                            }}
                            placeholder="Select company"
                          />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                )}

                {registerCompanyType === 'b2b' && companyId && (
                  <Form.Field
                    control={form.control}
                    name="userIds"
                    render={() => (
                      <Form.Item>
                        <Form.Label>Related customers *</Form.Label>
                        <Input
                          placeholder="Search by phone or email"
                          value={customerSearch}
                          onChange={(event) =>
                            setCustomerSearch(event.target.value)
                          }
                          className="mb-2"
                        />
                        <div className="mb-2 flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={selectAllFilteredCustomers}
                          >
                            Select all
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearCustomers}
                          >
                            Clear
                          </Button>
                        </div>
                        <Form.Control>
                          <div className="max-h-[220px] space-y-1 overflow-y-auto rounded-md border p-2">
                            {customersLoading ? (
                              <div className="py-4 text-center text-sm text-muted-foreground">
                                Loading customers...
                              </div>
                            ) : filteredRelatedCustomers.length === 0 ? (
                              <div className="py-4 text-center text-sm text-muted-foreground">
                                {relatedCustomers.length === 0
                                  ? 'No customers found for this company.'
                                  : 'No matching customers.'}
                              </div>
                            ) : (
                              filteredRelatedCustomers.map((customer) => (
                                <label
                                  key={customer._id}
                                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50"
                                >
                                  <Checkbox
                                    checked={userIds.includes(customer._id)}
                                    onCheckedChange={() =>
                                      toggleCustomer(customer._id)
                                    }
                                  />
                                  <span className="text-sm">
                                    {customer.primaryPhone ||
                                      customer.primaryEmail ||
                                      customer._id}
                                  </span>
                                </label>
                              ))
                            )}
                          </div>
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                )}

                {registerCompanyType === 'b2c' && (
                  <Form.Field
                    control={form.control}
                    name="userIds"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Customers *</Form.Label>
                        <Form.Control>
                          <SelectOneFitCustomer
                            mode="multiple"
                            type="erxes"
                            value={field.value ?? []}
                            onValueChange={(value) =>
                              field.onChange(
                                Array.isArray(value)
                                  ? value
                                  : [value].filter(Boolean),
                              )
                            }
                          />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                )}

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

                <Form.Field
                  control={form.control}
                  name="removePreviousCredits"
                  render={({ field }) => (
                    <Form.Item className="flex flex-row items-start gap-2 rounded-md border p-3">
                      <Checkbox
                        checked={Boolean(field.value)}
                        onCheckedChange={(value) =>
                          field.onChange(value === true)
                        }
                      />
                      <div className="space-y-1">
                        <Form.Label className="font-normal leading-snug">
                          When purchases are activated, clear existing credits
                          first, then grant selected plan credits.
                        </Form.Label>
                        <Form.Message />
                      </div>
                    </Form.Item>
                  )}
                />

                {selectedPlan && (
                  <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                    <div className="mb-2 font-medium">Summary</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-muted-foreground">Plan</div>
                      <div className="font-medium">{selectedPlan.name}</div>
                      <div className="text-muted-foreground">
                        Base price per user
                      </div>
                      <div className="font-medium">
                        {selectedPlan.price.toLocaleString()} MNT
                      </div>
                      <div className="text-muted-foreground">
                        Price per user
                      </div>
                      <div className="font-medium">
                        {tierPrice.toLocaleString()} MNT
                      </div>
                      <div className="text-muted-foreground">Quantity</div>
                      <div className="font-medium">{quantity}</div>
                      <div className="text-muted-foreground">
                        Applied sale option
                      </div>
                      <div className="font-medium">
                        {selectedTier
                          ? selectedTier.finalPrice != null
                            ? `Fixed ${selectedTier.finalPrice.toLocaleString()} MNT`
                            : `${selectedTier.discountPercent}% off`
                          : 'Default price'}
                      </div>
                      <div className="text-muted-foreground">
                        Users selected
                      </div>
                      <div className="font-medium">{userIds.length}</div>
                      <div className="text-muted-foreground">Total amount</div>
                      <div className="font-semibold">
                        {totalAmount.toLocaleString()} MNT
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
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid || submitLoading}>
                <Spinner show={submitLoading} />
                Create {userIds.length} purchase(s)
              </Button>
            </Sheet.Footer>
          </form>
        </Form>
      </Sheet.View>
    </Sheet>
  );
}
