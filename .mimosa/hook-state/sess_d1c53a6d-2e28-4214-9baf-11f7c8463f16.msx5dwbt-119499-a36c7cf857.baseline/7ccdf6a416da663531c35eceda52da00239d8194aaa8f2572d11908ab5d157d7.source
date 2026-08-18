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
  Form,
  Input,
  ScrollArea,
  Separator,
  Sheet,
  Spinner,
  useToast,
} from 'erxes-ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { IUnit } from '../types/unitType';

export const AddUnit = ({
  onClose,
  zone,
  units,
}: {
  onClose: () => void;
  zone: IZoning;
  units: IUnit[];
}) => {
  const { project } = useProjectDetail();

  const { toast } = useToast();

  const form = useForm<z.infer<typeof addUnitSchema>>({
    resolver: zodResolver(addUnitSchema),
    defaultValues: {
      number: (zone.floor < 0 ? `B${zone.floor * -1}` : zone.floor).toString(),
      type: '',
      useProjectPrice: true,
      mainPrice: project?.mainPrice,
      prices: project?.prices?.map((p) => ({
        currency: p.currency,
        price: p.price,
        priceType: p.priceType,
      })),
    },
    shouldFocusError: false,
  });
  const { createUnit, loading } = useUnitCreate({ zoning: zone._id });

  const onSubmit = (data: z.infer<typeof addUnitSchema>) => {
    const number = (units || []).find((unit) => unit.number === data.number);

    if (number) {
      toast({
        title: 'Error',
        description: 'Unit number already exists',
        variant: 'destructive',
      });
      return;
    }

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
            <div className="blk:space-y-5 p-6">
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

export const AddUnitSheet = ({
  zone,
  units,
}: {
  zone: IZoning;
  units: IUnit[];
}) => {
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
          <Sheet.Title className="flex items-center gap-2 text-base">
            {zone.floor < 0 ? `B${zone.floor * -1}` : zone.floor}{' '}
            <Separator.Inline /> Add unit
          </Sheet.Title>
          <Sheet.Close tabIndex={-1} />
        </Sheet.Header>
        {open && (
          <AddUnit onClose={() => setOpen(false)} zone={zone} units={units} />
        )}
      </Sheet.View>
    </Sheet>
  );
};
