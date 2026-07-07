import { IZoning } from '@/building/types/buildingTypes';
import { PricingForm } from '@/pricing/components/PricingForm';
import { useProjectDetail } from '@/project/hooks/useProjectDetail';
import { SelectUnitType } from '@/unit/components/SelectUnitType';
import { addUnitSchema } from '@/unit/constants/addUnitSchema';
import { useUnitCreate } from '@/unit/hooks/useUnitCreate';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconPlus } from '@tabler/icons-react';
import {
  Button,
  CurrencyField,
  Form,
  Input,
  ScrollArea,
  Separator,
  Sheet,
  Spinner,
} from 'erxes-ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export const AddUnit = ({
  onClose,
  zone,
}: {
  onClose: () => void;
  zone: IZoning;
}) => {
  const { project } = useProjectDetail();
  const form = useForm<z.infer<typeof addUnitSchema>>({
    resolver: zodResolver(addUnitSchema),
    defaultValues: {
      number: (zone.floor < 0 ? `B${zone.floor * -1}` : zone.floor).toString(),
      type: '',
      size: 0,
      useProjectPrice: true,
      mainPrice: project?.mainPrice,
      prices: project?.prices?.map((p) => ({
        currency: p.currency,
        price: p.price,
        priceType: p.priceType,
      })),
    },
  });
  const { createUnit, loading } = useUnitCreate({ zoning: zone._id });

  const onSubmit = (data: z.infer<typeof addUnitSchema>) => {
    const { mainPrice, prices, useProjectPrice, ...rest } = data;
    createUnit({
      variables: {
        input: {
          ...rest,
          ...(useProjectPrice ? { useProjectPrice } : { mainPrice, prices }),
          zoning: zone._id,
        },
      },
      onCompleted: () => {
        onClose();
        form.reset();
      },
    });
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col flex-auto overflow-hidden"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Sheet.Content className="flex-auto overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-5">
              <Form.Field
                name="number"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Number</Form.Label>
                    <Input {...field} />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="type"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Type</Form.Label>
                    <SelectUnitType
                      value={field.value}
                      onValueChange={field.onChange}
                      inForm
                    />
                  </Form.Item>
                )}
              />
              <Form.Field
                name="size"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Size</Form.Label>
                    <CurrencyField.ValueInput {...field} />
                  </Form.Item>
                )}
              />
              <PricingForm form={form} />
            </div>
          </ScrollArea>
        </Sheet.Content>
        <Sheet.Footer className="flex-none">
          <Sheet.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Sheet.Close>
          <Button type="submit" disabled={loading}>
            <Spinner show={loading} />
            Add unit
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};

export const AddUnitSheet = ({ zone }: { zone: IZoning }) => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button variant="secondary">
          <IconPlus />
          Add unit
        </Button>
      </Sheet.Trigger>
      <Sheet.View>
        <Sheet.Header>
          <Sheet.Title className="text-base flex items-center gap-2">
            {zone.floor < 0 ? `B${zone.floor * -1}` : zone.floor}{' '}
            <Separator.Inline /> Add unit
          </Sheet.Title>
          <Sheet.Close tabIndex={-1} />
        </Sheet.Header>
        {open && <AddUnit onClose={() => setOpen(false)} zone={zone} />}
      </Sheet.View>
    </Sheet>
  );
};
