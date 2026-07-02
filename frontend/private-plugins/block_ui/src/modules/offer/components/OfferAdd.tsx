import {
  Button,
  Sheet,
  Spinner,
  Form,
  ScrollArea,
  Select,
  Separator,
  useQueryState,
  CurrencyField,
  CurrencyCode,
  DatePicker,
  toast,
} from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useCreateOffer } from '@/offer/hooks/useManageOffer';
import { useForm, UseFormReturn } from 'react-hook-form';
import { OfferFormData, offerSchema } from '@/offer/constants/offerSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  SelectCustomer,
  SelectCompany,
  SelectMember,
  currentUserState,
} from 'ui-modules';
import { useAtomValue } from 'jotai';
import { useUnit } from '@/unit/hooks/useUnit';
import { IUnit } from '@/unit/types/unitType';
import { addDays } from 'date-fns';
import { PaymentPlanForm } from '@/pricing/components/PaymentPlanForm';
import { PaymentScheduleEditor } from '@/contract/components/PaymentScheduleEditor';
import { ContractUnit } from '@/contract/components/ContractUnit';
import { useParams } from 'react-router-dom';
import { useBuildings, useBuildingZonings } from '@/building/hooks/useBuildings';
import { useUnits } from '@/unit/hooks/useUnits';
import { useState, useEffect } from 'react';

export const OfferAddSheet = () => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button>
          <IconPlus />
          Add offer
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="blk:sm:max-w-5xl blk:md:w-[calc(100vw-(--spacing(4)))]">
        <Sheet.Header>
          <Sheet.Title>Add offer</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <OfferAddForm onClose={() => setOpen(false)} />
      </Sheet.View>
    </Sheet>
  );
};


export const OfferAddForm = ({
  onClose,
  defaultValues,
  onSubmit: externalOnSubmit,
  submitLabel = 'Add offer',
  externalLoading = false,
  unit: unitProp,
}: {
  onClose: () => void;
  defaultValues?: Partial<OfferFormData>;
  onSubmit?: (data: OfferFormData) => void;
  submitLabel?: string;
  externalLoading?: boolean;
  unit?: IUnit;
}) => {
  const [unitId] = useQueryState<string>('unitId');
  const { projectId } = useParams<{ projectId?: string }>();
  const currentUser = useAtomValue(currentUserState);

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: defaultValues ?? {
      paymentPlanId: '',
      date: new Date().toISOString(),
      endDate: addDays(new Date(), 7),
      partyType: 'customer',
      partyId: '',
      user: currentUser?._id,
      priceId: 'mainPrice',
      price: { currency: CurrencyCode.MNT, price: 0 },
    },
  });

  const selectedUnit = form.watch('unit' as any) as string | undefined;
  const activeUnitId = unitProp?._id || unitId || selectedUnit;
  const { unit: fetchedUnit } = useUnit(!unitProp ? activeUnitId : undefined);
  const unit = unitProp || fetchedUnit;

  const { createOffer, loading: createLoading } = useCreateOffer();
  const loading = externalLoading || createLoading;

  const handleSubmit = (data: OfferFormData) => {
    if (externalOnSubmit) {
      externalOnSubmit(data);
      return;
    }
    const resolvedUnitId = unitId || (data as any).unit;
    createOffer({
      variables: {
        input: {
          amount: data.price?.price,
          currency: data.price?.currency,
          date: data.date || new Date().toISOString(),
          endDate: data.endDate?.toISOString(),
          party: data.partyType ? { type: data.partyType, id: data.partyId } : undefined,
          paymentPlan: data.paymentPlan,
          user: data.user,
          unit: resolvedUnitId,
          project: projectId || undefined,
        },
      },
      onCompleted: () => {
        toast({
          title: 'Offer created successfully',
          variant: 'default',
        });
        onClose();
        form.reset();
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form
        className="flex-auto flex flex-col overflow-hidden"
        onSubmit={form.handleSubmit(handleSubmit)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT')
            e.preventDefault();
        }}
      >
        <Sheet.Content className="flex-auto overflow-hidden">
          <ScrollArea className="h-full">
            {(unitProp || unitId || projectId) && (
              <div className="p-5">
                {unitProp || unitId ? (
                  <ContractUnit unitId={unitProp?._id || unitId} />
                ) : (
                  <OfferUnitSelector form={form} projectId={projectId} />
                )}
              </div>
            )}
            <div className="grid grid-cols-4 gap-5 p-5">
              <Form.Field
                name="user"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Assigned to</Form.Label>
                    <SelectMember.FormItem
                      value={field.value}
                      onValueChange={field.onChange}
                      mode="single"
                    />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="date"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Offer Date</Form.Label>
                    <DatePicker
                      placeholder="Select date"
                      value={field.value ? new Date(Number(field.value) || field.value) : undefined}
                      onChange={(date) => {
                        const d = Array.isArray(date) ? date[0] : date;
                        field.onChange(d ? d.toISOString() : undefined);
                      }}
                    />
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="endDate"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Offer Expires On</Form.Label>
                    <DatePicker
                      placeholder="end date"
                      value={field.value}
                      onChange={(date) => field.onChange(date as Date)}
                    />
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="partyType"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Lead Type</Form.Label>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.resetField('partyId');
                      }}
                      value={field.value}
                    >
                      <Form.Control>
                        <Select.Trigger className="h-8">
                          <Select.Value placeholder="Select party type" />
                        </Select.Trigger>
                      </Form.Control>
                      <Select.Content>
                        <Select.Item value="customer">Customer</Select.Item>
                        <Select.Item value="company">Company</Select.Item>
                      </Select.Content>
                    </Select>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <SelectLead form={form} />
              <Form.Field
                name="price.currency"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Currency</Form.Label>
                    <CurrencyField.SelectCurrency
                      value={field.value as CurrencyCode}
                      onChange={(value) =>
                        field.onChange(value as CurrencyCode)
                      }
                      display="code"
                    />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="price.price"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Price per m²</Form.Label>
                    <CurrencyField.ValueInput
                      value={field.value as number}
                      onChange={(value) => field.onChange(value as number)}
                    />
                  </Form.Item>
                )}
              />
              <Separator className="col-span-4" />
              <PaymentPlanForm form={form} />
            </div>
            <Separator />
            <div className="px-5 py-5">
              <OfferPaymentSchedule form={form} unit={unit} />
            </div>
          </ScrollArea>
        </Sheet.Content>
        <Sheet.Footer className="flex-none">
          <OfferSummary form={form} unit={unit} />
          <Sheet.Close asChild>
            <Button variant="secondary" className="bg-border">
              Cancel
            </Button>
          </Sheet.Close>
          <Button type="submit" disabled={loading}>
            <Spinner show={loading} />
            {submitLabel}
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};

const OfferPaymentSchedule = ({
  form,
  unit,
}: {
  form: UseFormReturn<OfferFormData>;
  unit: IUnit;
}) => {
  const pricePerUnit = form.watch('price.price') || 0;
  const currency = form.watch('price.currency') || 'MNT';
  const unitSize = unit?.unitType?.size || 0;
  const totalAmount = unitSize > 0 ? pricePerUnit * unitSize : pricePerUnit;

  return (
    <PaymentScheduleEditor form={form} amount={totalAmount} currency={currency} />
  );
};

export const SelectLead = ({
  form,
}: {
  form: UseFormReturn<OfferFormData>;
}) => {
  const leadType = form.watch('partyType');
  const SelectLeadComponent =
    leadType === 'customer' ? SelectCustomer.FormItem : SelectCompany;
  return (
    <Form.Field
      control={form.control}
      name="partyId"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>Lead</Form.Label>
          <SelectLeadComponent
            value={field.value}
            onValueChange={field.onChange}
            mode="single"
          />
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};

const OfferUnitSelector = ({
  form,
  projectId,
}: {
  form: UseFormReturn<OfferFormData>;
  projectId?: string;
}) => {
  const [buildingId, setBuildingId] = useState('');
  const [zoningId, setZoningId] = useState('');
  const { buildings = [] } = useBuildings({ projectId: projectId || '' });
  const { buildingZonings = [] } = useBuildingZonings({ buildingId, skip: !buildingId });
  const { units = [] } = useUnits({ variables: { zoning: zoningId }, skip: !zoningId });

  useEffect(() => { setZoningId(''); (form as any).setValue('unit', ''); }, [buildingId]);
  useEffect(() => { (form as any).setValue('unit', ''); }, [zoningId]);

  if (!projectId) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Form.Label>Building</Form.Label>
        <Select value={buildingId} onValueChange={setBuildingId}>
          <Select.Trigger className="h-8"><Select.Value placeholder="Select building" /></Select.Trigger>
          <Select.Content>
            {buildings.map((b) => <Select.Item key={b._id} value={b._id}>{b.name}</Select.Item>)}
          </Select.Content>
        </Select>
      </div>
      <div className="space-y-2">
        <Form.Label>Zone</Form.Label>
        <Select value={zoningId} onValueChange={setZoningId} disabled={!buildingId}>
          <Select.Trigger className="h-8"><Select.Value placeholder="Select zone" /></Select.Trigger>
          <Select.Content>
            {buildingZonings.map((z) => <Select.Item key={z._id} value={z._id}>Floor {z.floor}</Select.Item>)}
          </Select.Content>
        </Select>
      </div>
      <Form.Field
        name={'unit' as any}
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Unit</Form.Label>
            <Select
              value={field.value || ''}
              onValueChange={(uid) => {
                field.onChange(uid);
                const selected = units.find((u) => u._id === uid);
                if (selected?.unitType?.price != null)
                  form.setValue('price.price', Number(selected.unitType.price));
              }}
              disabled={!zoningId}
            >
              <Form.Control>
                <Select.Trigger className="h-8"><Select.Value placeholder="Select unit" /></Select.Trigger>
              </Form.Control>
              <Select.Content>
                {units.map((u) => (
                  <Select.Item key={u._id} value={u._id}>Unit {u.number}</Select.Item>
                ))}
              </Select.Content>
            </Select>
            <Form.Message />
          </Form.Item>
        )}
      />
    </div>
  );
};

export const OfferSummary = ({
  form,
  unit,
}: {
  form: UseFormReturn<OfferFormData>;
  unit: IUnit;
}) => {
  const price = form.watch('price.price') || 0;
  const currency = form.watch('price.currency');
  const discountPct = form.watch('paymentPlan.discountPercentage') || 0;
  const unitSize = unit?.unitType?.size || 0;
  const totalAmount = unitSize > 0 ? price * unitSize : price;
  const discountAmount = (totalAmount * discountPct) / 100;
  const offerPrice = totalAmount - discountAmount;

  return (
    <div className="flex-auto flex gap-4 items-center text-sm">
      <span className="text-muted-foreground flex items-center gap-1 font-medium">
        Total:
        <span className="text-primary font-bold">
          {totalAmount.toLocaleString()}
        </span>
        {currency}
      </span>
      {discountPct > 0 && (
        <span className="text-muted-foreground flex items-center gap-1 font-medium">
          Discount:
          <span className="text-destructive font-bold">
            -{discountAmount.toLocaleString()}
          </span>
          {currency}
        </span>
      )}
      {discountPct > 0 && (
        <span className="text-muted-foreground flex items-center gap-1 font-medium">
          Offer price:
          <span className="text-primary font-bold">
            {offerPrice.toLocaleString()}
          </span>
          {currency}
        </span>
      )}
    </div>
  );
};
