import { zodResolver } from '@hookform/resolvers/zod';
import { IconAlertCircle, IconPlus } from '@tabler/icons-react';
import {
  Alert,
  Button,
  CurrencyField,
  Form,
  Separator,
  Sheet,
  Spinner,
  toast,
} from 'erxes-ui';
import { IZoning } from '@/building/types/buildingTypes';
import { SelectUnitType } from '@/unit/components/SelectUnitType';
import { addUnitsMultipleSchema } from '@/unit/constants/addUnitSchema';
import { useUnitCreate } from '@/unit/hooks/useUnitCreate';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export const AddUnitsMultiple = ({ zone }: { zone: IZoning }) => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button variant="secondary">
          <IconPlus />
          Add multiple units
        </Button>
      </Sheet.Trigger>
      <Sheet.View>
        <Sheet.Header>
          <Sheet.Title className="text-base flex items-center gap-2">
            {zone.floor < 0 ? `B${zone.floor * -1}` : zone.floor}{' '}
            <Separator.Inline /> Add multiple units
          </Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <AddUnitsMultipleForm zone={zone} onClose={() => setOpen(false)} />
      </Sheet.View>
    </Sheet>
  );
};

export const AddUnitsMultipleForm = ({
  zone,
  onClose,
}: {
  zone: IZoning;
  onClose: () => void;
}) => {
  const form = useForm({
    resolver: zodResolver(addUnitsMultipleSchema),
    defaultValues: {
      type: '',
      size: 0,
      count: 0,
    },
  });
  const { createUnit, loading } = useUnitCreate({ zoning: zone._id });

  const onSubmit = (data: z.infer<typeof addUnitsMultipleSchema>) => {
    const units = Array.from({ length: data.count }).map((_, index) => {
      const number = `${zone.floor < 0 ? `B${zone.floor * -1}` : zone.floor}${
        index + 1 < 10 ? `0${index + 1}` : index + 1
      }`;

      return createUnit({
        variables: {
          input: {
            type: data.type,
            size: data.size,
            number,
            zoning: zone._id,
            useProjectPrice: true,
          },
        },
      });
    });
    Promise.all(units);
    onClose();
    form.reset();
    toast({
      title: 'Success',
      description: 'Units created successfully',
      variant: 'default',
    });
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col flex-auto"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Sheet.Content className="p-6 space-y-5">
          <Alert>
            <IconAlertCircle />
            <Alert.Title>Warning</Alert.Title>
            <Alert.Description>
              This will create multiple units with the same size and price based
              on the project's pricing.
            </Alert.Description>
          </Alert>
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
          <Form.Field
            name="count"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Count</Form.Label>
                <CurrencyField.ValueInput {...field} />
              </Form.Item>
            )}
          />
        </Sheet.Content>
        <Sheet.Footer>
          <Sheet.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Sheet.Close>
          <Button type="submit" disabled={loading}>
            <Spinner show={loading} />
            Add units
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};
