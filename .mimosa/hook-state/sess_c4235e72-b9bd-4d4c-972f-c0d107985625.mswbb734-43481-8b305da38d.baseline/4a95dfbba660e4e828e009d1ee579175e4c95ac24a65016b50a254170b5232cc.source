import { zodResolver } from '@hookform/resolvers/zod';
import { IconPlus } from '@tabler/icons-react';
import { addDays } from 'date-fns';
import {
  Button,
  CurrencyCode,
  CurrencyField,
  DatePicker,
  Form,
  Input,
  Label,
  ScrollArea,
  Select,
  Separator,
  Sheet,
  Spinner,
  toast,
  useQueryState,
} from 'erxes-ui';
import { InfoCard, InfoCardContent } from '@/block/components/card';
import { OfferFormData, offerSchema } from '@/offer/constants/offerSchema';
import { useCreateOffer } from '@/offer/hooks/useManageOffer';
import { SelectPaymentPlan } from '@/pricing/components/SelectPaymentPlan';
import { SelectPaymentPlanFrequency } from '@/pricing/components/SelectPaymentPlanFrequency';
import { SelectPaymentPlanType } from '@/pricing/components/SelectPaymentPlanType';
import { SelectPrice } from '@/pricing/components/SelectPrice';
import { SelectPriceType } from '@/pricing/components/SelectPriceType';
import { IProjectPrice } from '@/project/types/projectTypes';
import { useUnit } from '@/unit/hooks/useUnit';
import { IUnit } from '@/unit/types/unitType';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import {
  currentUserState,
  SelectCompany,
  SelectCustomer,
  SelectMember,
} from 'ui-modules';
import { z } from 'zod';

export const OfferAddSheet = () => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button variant="secondary">
          <IconPlus />
          Add offer
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="sm:max-w-screen-lg md:w-[calc(100vw-theme(spacing.4))]">
        <Sheet.Header>
          <Sheet.Title>Add offer</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <OfferAddForm onClose={() => setOpen(false)} />
      </Sheet.View>
    </Sheet>
  );
};

export const OfferAddForm = ({ onClose }: { onClose: () => void }) => {
  const [unitId] = useQueryState<string>('unitId');
  const { unit } = useUnit(unitId);
  const currentUser = useAtomValue(currentUserState);
  const mainPrice = {
    _id: 'mainPrice',
    currency: CurrencyCode.MNT,
    price: unit?.mainPrice,
    priceType: 'priceBySize' as any,
  };

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      paymentPlanId: '',
      endDate: addDays(new Date(), 7),
      partyType: 'customer',
      partyId: '',
      user: currentUser?._id,
      priceId: mainPrice._id,
      price: mainPrice,
    },
  });

  const { createOffer, loading } = useCreateOffer();

  const handleSubmit = (data: OfferFormData) => {
    createOffer({
      variables: {
        input: {
          amount: data.price.price,
          amountType: data.price.priceType,
          currency: data.price.currency,
          date: new Date(),
          endDate: data.endDate,
          party: {
            type: data.partyType,
            id: data.partyId,
          },
          paymentPlan: data.paymentPlan,
          user: data.user,
          unit: unitId,
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

  const handlePercentChange =
    (callback: (value: number) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      callback(Math.min(Math.max(Number(e.target.value), 0), 100));
    };

  return (
    <Form {...form}>
      <form
        className="flex-auto flex flex-col overflow-hidden"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <Sheet.Content className="flex-auto overflow-hidden">
          <ScrollArea className="h-full">
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
                name="endDate"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Offer expires on</Form.Label>
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
              <Separator className="col-span-4" />
              <Form.Field
                name="paymentPlanId"
                render={({ field }) => (
                  <Form.Item className="col-start-1">
                    <Form.Label>Payment plan</Form.Label>
                    <SelectPaymentPlan
                      value={field.value}
                      onValueChange={field.onChange}
                      form={form}
                    />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="paymentPlan.type"
                render={({ field }) => (
                  <Form.Item className="col-start-1">
                    <Form.Label>type</Form.Label>
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
                name="paymentPlan.discountPercentage"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>discount percentage</Form.Label>
                    <Input
                      {...field}
                      onChange={handlePercentChange(field.onChange)}
                      type="number"
                      max={100}
                      min={0}
                    />
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="paymentPlan.downPaymentPercentage"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>down payment percentage</Form.Label>
                    <Input
                      {...field}
                      onChange={handlePercentChange(field.onChange)}
                      type="number"
                      max={100}
                      min={0}
                    />
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="paymentPlan.interestPercentage"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>interest percentage</Form.Label>
                    <Input
                      {...field}
                      onChange={handlePercentChange(field.onChange)}
                      type="number"
                      max={100}
                      min={0}
                    />
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="paymentPlan.frequency"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>frequency</Form.Label>
                    <SelectPaymentPlanFrequency
                      value={field.value}
                      onValueChange={field.onChange}
                      inForm
                    />
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="paymentPlan.installment"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>installment</Form.Label>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      type="number"
                    />
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Separator className="col-span-4" />
              <Form.Field
                name="priceId"
                render={({ field }) => (
                  <Form.Item className="col-start-1">
                    <Form.Label>Price</Form.Label>
                    <SelectPrice
                      prices={[
                        mainPrice,
                        ...(unit?.prices || []).map((price: IProjectPrice) => ({
                          ...price,
                          _id: price.currency + price.price + price.priceType,
                        })),
                      ]}
                      form={form}
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="price.currency"
                render={({ field }) => (
                  <Form.Item className="col-start-1">
                    <Form.Label>Price Currency</Form.Label>
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
                    <Form.Label>Price</Form.Label>
                    <CurrencyField.ValueInput
                      value={field.value as number}
                      onChange={(value) => field.onChange(value as number)}
                    />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="price.priceType"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Price Type</Form.Label>
                    <SelectPriceType
                      value={field.value as IProjectPrice['priceType']}
                      onValueChange={(value) =>
                        field.onChange(value as IProjectPrice['priceType'])
                      }
                    />
                  </Form.Item>
                )}
              />
            </div>
            <Separator className="col-span-4 mt-2" />

            <OfferPrice form={form} unit={unit} />
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
            Add offer
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};

export const OfferPrice = ({
  form,
  unit,
}: {
  form: UseFormReturn<z.infer<typeof offerSchema>>;
  unit: IUnit;
}) => {
  const formData = form.watch();

  if (!formData.paymentPlanId) {
    return null;
  }
  const { downPaymentPercentage, discountPercentage, installment } =
    formData.paymentPlan;

  const { price, priceType } = formData.price;

  const discountAmount = ((discountPercentage || 0) * price) / 100;
  const offerPrice = price - discountAmount;
  const offerTotalPrice =
    offerPrice * (priceType === 'priceBySize' ? unit?.size : 1);

  const installmentPercentage = (100 - downPaymentPercentage) / installment;

  const installmentAmount = (offerTotalPrice * installmentPercentage) / 100;

  return (
    <div className="grid grid-cols-4 gap-5 p-5 bg-accent">
      <div className="col-span-4">
        <InfoCard title="Төлөлтийн график">
          <InfoCardContent>
            <div className="grid grid-cols-5 gap-2">
              <Label asChild>
                <div>Төлөлт</div>
              </Label>
              <Label asChild>
                <div>Огноо</div>
              </Label>
              <Label asChild>
                <div>Төлбөрийн хэлбэр</div>
              </Label>
              <Label asChild>
                <div>100%</div>
              </Label>
              <Label asChild>
                <div>ҮНДСЭН ДҮН</div>
              </Label>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <Input
                value={'Захиалга'}
                disabled
                className="disabled:opacity-100"
              />
              <Input
                value={'Гэрээ хийгдсэн өдөр'}
                disabled
                className="disabled:opacity-100"
              />
              <Input
                value={'Урьдчилгаа'}
                disabled
                className="disabled:opacity-100"
              />
              <Input
                value={downPaymentPercentage + '%'}
                disabled
                className="disabled:opacity-100"
              />
              <CurrencyField.ValueInput
                value={
                  (offerPrice *
                    (priceType === 'priceBySize' ? unit?.size : 1) *
                    downPaymentPercentage) /
                  100
                }
                disabled
                className="disabled:opacity-100"
              />
            </div>
            {Array.from({ length: installment }).map((_, index) => (
              <div className="grid grid-cols-5 gap-2">
                <Input
                  value={'Төлөлт ' + (index + 1)}
                  disabled
                  className="disabled:opacity-100"
                />
                <Input
                  value={installment === index + 1 ? 'Түлхүүр хүлээлгэхэд' : ''}
                  disabled
                  className="disabled:opacity-100"
                />
                <Input
                  value={
                    installment !== index + 1
                      ? 'ажлын гүйцэтгэлийн төлөлт '
                      : ''
                  }
                  disabled
                  className="disabled:opacity-100"
                />
                <Input
                  value={
                    installmentPercentage.toFixed(2).replace('.00', '') + '%'
                  }
                  disabled
                  className="disabled:opacity-100"
                />
                <CurrencyField.ValueInput
                  value={installmentAmount}
                  disabled
                  className="disabled:opacity-100"
                />
              </div>
            ))}
          </InfoCardContent>
        </InfoCard>
      </div>
    </div>
  );
};

export const SelectLead = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof offerSchema>>;
}) => {
  const leadType = form.watch('partyType');
  const SelectLead =
    leadType === 'customer' ? SelectCustomer.FormItem : SelectCompany;
  return (
    <Form.Field
      control={form.control}
      name="partyId"
      render={({ field }) => (
        <Form.Item>
          <Form.Label>Lead</Form.Label>
          <SelectLead
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

export const OfferSummary = ({
  form,
  unit,
}: {
  form: UseFormReturn<z.infer<typeof offerSchema>>;
  unit: IUnit;
}) => {
  const formData = form.watch();

  if (!formData.paymentPlanId) {
    return null;
  }

  const { discountPercentage } = formData.paymentPlan;

  const { price, priceType } = formData.price;

  const discountAmount = ((discountPercentage || 0) * price) / 100;
  const offerPrice = price - discountAmount;
  const offerTotalPrice =
    offerPrice * (priceType === 'priceBySize' ? unit?.size : 1);
  const totalDiscount =
    discountAmount * (priceType === 'priceBySize' ? unit?.size : 1);

  const initialPrice =
    (priceType === 'priceBySize' ? unit?.size : 1) * (price || 0);

  return (
    <div className="flex-auto flex gap-4 items-center text-sm">
      <span className="text-muted-foreground flex items-center gap-1 font-medium">
        Initial price:
        <span className="text-primary font-bold">
          {initialPrice.toLocaleString()}
        </span>
        {formData.price.currency}
      </span>
      <span className="text-muted-foreground flex items-center gap-1 font-medium">
        Discount:
        <span className="text-destructive font-bold">
          -{totalDiscount.toLocaleString()}
        </span>
        {formData.price.currency}
      </span>
      <span className="text-muted-foreground flex items-center gap-1 font-medium">
        Offer price:
        <span className="text-primary font-bold">
          {offerTotalPrice.toLocaleString()}
        </span>
        {formData.price.currency}
      </span>
    </div>
  );
};
