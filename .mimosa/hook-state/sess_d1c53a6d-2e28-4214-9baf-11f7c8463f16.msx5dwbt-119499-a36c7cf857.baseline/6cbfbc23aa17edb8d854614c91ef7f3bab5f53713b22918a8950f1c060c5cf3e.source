import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Button, Checkbox, CurrencyField, Form, Label, Select } from 'erxes-ui';
import { addUnitSchema } from '@/unit/constants/addUnitSchema';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

export const PricingForm = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof addUnitSchema>>;
}) => {
  const { useProjectPrice } = form.watch();
  return (
    <>
      <Form.Field
        name="useProjectPrice"
        render={({ field }) => (
          <Form.Item className="space-x-2">
            <Form.Control>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </Form.Control>
            <Form.Label variant="peer">Use project price</Form.Label>
          </Form.Item>
        )}
      />
      <Form.Field
        name="mainPrice"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Main price</Form.Label>
            <CurrencyField.ValueInput {...field} disabled={useProjectPrice} />
          </Form.Item>
        )}
      />
      <PricesForm form={form} disabled={useProjectPrice} />
    </>
  );
};

const PricesForm = ({
  form,
  disabled,
}: {
  form: UseFormReturn<z.infer<typeof addUnitSchema>>;
  disabled: boolean;
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'prices',
  });

  return (
    <div className="space-y-2">
      <Label asChild>
        <legend>Prices</legend>
      </Label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <div className="grid grid-cols-4 gap-2">
            <Form.Field
              name={`prices.${index}.currency`}
              render={({ field }) => (
                <Form.Item>
                  <CurrencyField.SelectCurrency
                    {...field}
                    display="code"
                    disabled={disabled}
                  />
                </Form.Item>
              )}
            />
            <Form.Field
              name={`prices.${index}.price`}
              render={({ field }) => (
                <Form.Item className="col-span-2">
                  <CurrencyField.ValueInput {...field} disabled={disabled} />
                </Form.Item>
              )}
            />
            <Form.Field
              name={`prices.${index}.priceType`}
              render={({ field }) => (
                <Form.Item>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    disabled={disabled}
                  >
                    <Form.Control>
                      <Select.Trigger className="h-8">
                        <Select.Value placeholder="Price type" />
                      </Select.Trigger>
                    </Form.Control>
                    <Select.Content>
                      <Select.Item value="priceBySize">per m²</Select.Item>
                      <Select.Item value="priceByUnit">per unit</Select.Item>
                    </Select.Content>
                  </Select>
                </Form.Item>
              )}
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="size-8 text-destructive bg-destructive/10 hover:bg-destructive/20"
            onClick={() => remove(index)}
            disabled={disabled}
          >
            <IconTrash />
          </Button>
        </div>
      ))}

      <Button
        variant="secondary"
        className="w-full"
        onClick={() =>
          append({
            currency: '',
            price: 0,
            priceType: 'priceBySize',
          })
        }
        disabled={disabled}
      >
        <IconPlus /> Add Price
      </Button>
    </div>
  );
};
