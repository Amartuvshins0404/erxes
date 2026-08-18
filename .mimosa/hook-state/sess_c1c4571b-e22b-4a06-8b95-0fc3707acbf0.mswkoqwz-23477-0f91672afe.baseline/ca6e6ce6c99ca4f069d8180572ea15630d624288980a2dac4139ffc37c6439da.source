import { useQuery } from '@apollo/client';
import {
  Button,
  Dialog,
  Form,
  Input,
  Select,
  Spinner,
  Textarea,
} from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo, useState } from 'react';
import { ONE_FIT_ACTIVE_MEMBERSHIP_PLANS } from '~/modules/membership/graphql/membershipPlanQueries';
import { OneFitMembershipPlan } from '~/modules/membership/types/membership';
import { SelectCompany } from './SelectCompany';
import { ONE_FIT_CUSTOMERS_BY_COMPANY_ID } from '../graphql/companyQueries';
import { useBulkCreateCreditTransactions } from '../hooks/useCreditMutations';
import {
  OneFitCreditTransactionType,
  OneFitCreditSource,
} from '../types/credit';
import { Checkbox } from 'erxes-ui';

const bulkCreditTransactionSchema = z.object({
  companyId: z.string().min(1, { message: 'Company is required' }),
  customerIds: z
    .array(z.string())
    .min(1, { message: 'Select at least one customer' }),
  planId: z.string().min(1, { message: 'Membership plan is required' }),
  description: z.string().optional(),
});

type BulkCreditTransactionFormData = z.infer<
  typeof bulkCreditTransactionSchema
>;

interface BulkCreditTransactionDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function BulkCreditTransactionDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: BulkCreditTransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? (controlledOpen as boolean) : internalOpen;
  const setOpen = isControlled
    ? controlledOnOpenChange || (() => {})
    : setInternalOpen;

  const form = useForm<BulkCreditTransactionFormData>({
    resolver: zodResolver(bulkCreditTransactionSchema),
    defaultValues: {
      companyId: '',
      customerIds: [],
      planId: '',
      description: '',
    },
  });

  const companyId = form.watch('companyId');

  const { data: customersData, loading: companyLoading } = useQuery(
    ONE_FIT_CUSTOMERS_BY_COMPANY_ID,
    {
      variables: { companyId: companyId || '' },
      skip: !companyId,
    },
  );

  const { data: plansData } = useQuery(ONE_FIT_ACTIVE_MEMBERSHIP_PLANS);
  const plans: OneFitMembershipPlan[] =
    plansData?.oneFitActiveMembershipPlans ?? [];

  const { bulkCreateCreditTransactions, loading: submitLoading } =
    useBulkCreateCreditTransactions();

  const relatedCustomers = customersData?.oneFitCustomersByCompanyId ?? [];
  const [customerSearch, setCustomerSearch] = useState('');

  const filteredRelatedCustomers = useMemo(() => {
    if (!customerSearch.trim()) return relatedCustomers;
    const term = customerSearch.trim().toLowerCase();
    return relatedCustomers.filter(
      (c: { _id: string; primaryPhone?: string; primaryEmail?: string }) => {
        const phone = (c.primaryPhone ?? '').toLowerCase();
        const email = (c.primaryEmail ?? '').toLowerCase();
        return phone.includes(term) || email.includes(term);
      },
    );
  }, [relatedCustomers, customerSearch]);
  const planId = form.watch('planId');
  const selectedPlan = plans.find((p) => p._id === planId);

  function handleClose() {
    setOpen(false);
    setCustomerSearch('');
    form.reset({
      companyId: '',
      customerIds: [],
      planId: '',
      description: '',
    });
  }

  function onSubmit(values: BulkCreditTransactionFormData) {
    if (!selectedPlan) return;
    bulkCreateCreditTransactions({
      variables: {
        userIds: values.customerIds,
        companyId: values.companyId,
        amount: selectedPlan.creditAmount,
        transactionType: OneFitCreditTransactionType.PURCHASE,
        source: OneFitCreditSource.CORPORATE,
        membershipPlanId: values.planId,
        description: values.description?.trim() || undefined,
      },
      onCompleted: () => handleClose(),
    });
  }

  const customerIds = form.watch('customerIds') ?? [];
  const toggleCustomer = (customerId: string) => {
    const next = customerIds.includes(customerId)
      ? customerIds.filter((id) => id !== customerId)
      : [...customerIds, customerId];
    form.setValue('customerIds', next);
  };
  const selectAll = () => {
    form.setValue(
      'customerIds',
      filteredRelatedCustomers.map((c: { _id: string }) => c._id),
    );
  };
  const clearAll = () => form.setValue('customerIds', []);

  const isValid = !!companyId && (customerIds?.length ?? 0) > 0 && !!planId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && trigger && (
        <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      )}
      <Dialog.Content className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <Dialog.Header>
          <Dialog.Title>Bulk credit (corporate)</Dialog.Title>
          <Dialog.Description>
            Select one company, then choose which related customers to credit.
            All transactions will use the selected plan and source: corporate.
          </Dialog.Description>
        </Dialog.Header>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <Form.Field
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Company *</Form.Label>
                  <Form.Control>
                    <SelectCompany
                      value={field.value ?? ''}
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue('customerIds', []);
                        setCustomerSearch('');
                      }}
                      placeholder="Select company"
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />

            {companyId && (
              <Form.Field
                control={form.control}
                name="customerIds"
                render={() => (
                  <Form.Item>
                    <Form.Label>Related customers *</Form.Label>
                    <Input
                      placeholder="Search by phone or email"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="mb-2"
                    />
                    <div className="flex gap-2 mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAll}
                      >
                        Select all
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearAll}
                      >
                        Clear
                      </Button>
                    </div>
                    <Form.Control>
                      <div className="border rounded-md max-h-[200px] overflow-y-auto p-2 space-y-1">
                        {companyLoading ? (
                          <div className="text-sm text-muted-foreground py-4 text-center">
                            Loading customers...
                          </div>
                        ) : filteredRelatedCustomers.length === 0 ? (
                          <div className="text-sm text-muted-foreground py-4 text-center">
                            {relatedCustomers.length === 0
                              ? 'No customers found for this company.'
                              : 'No matching customers.'}
                          </div>
                        ) : (
                          filteredRelatedCustomers.map(
                            (customer: {
                              _id: string;
                              primaryPhone?: string;
                              primaryEmail?: string;
                            }) => (
                              <label
                                key={customer._id}
                                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer"
                              >
                                <Checkbox
                                  checked={customerIds.includes(customer._id)}
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
                            ),
                          )
                        )}
                      </div>
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <Select.Trigger>
                        <Select.Value placeholder="Select membership plan" />
                      </Select.Trigger>
                      <Select.Content>
                        {plans.map((plan) => (
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

            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Description</Form.Label>
                  <Form.Control>
                    <Textarea
                      {...field}
                      placeholder="Optional description"
                      rows={2}
                      value={field.value ?? ''}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />

            {selectedPlan && (
              <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                <div className="font-medium mb-2">Summary</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Credits per user</div>
                  <div className="font-medium">{selectedPlan.creditAmount}</div>
                  <div className="text-muted-foreground">Users selected</div>
                  <div className="font-medium">{customerIds?.length ?? 0}</div>
                  <div className="text-muted-foreground">Source</div>
                  <div className="font-medium">Corporate</div>
                </div>
              </div>
            )}

            <Dialog.Footer>
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
                Create {customerIds?.length ?? 0} transaction(s)
              </Button>
            </Dialog.Footer>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
}
