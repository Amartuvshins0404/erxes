import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Dialog,
  Form,
  Input,
  Select,
  Spinner,
  Textarea,
} from 'erxes-ui';
import { useTranslation } from 'react-i18next';

import {
  CAR_BODY_TYPE_OPTIONS,
  CAR_FUEL_TYPE_OPTIONS,
  CAR_GEARBOX_OPTIONS,
  EMPTY_SELECT_VALUE,
  fromSelectValue,
  toSelectValue,
} from '~/lib/constants';
import { buildCategoryOptions } from '~/lib/categoryTree';
import { getCarDisplayName, getTranslatedLabel } from '~/lib/car';
import { useCarMutations } from '~/hooks/useCarMutations';
import { ICar, ICarCategory } from '~/types/car';

const mergeFormSchema = z.object({
  ownerId: z.string().default(''),
  description: z.string().default(''),
  plateNumber: z.string().default(''),
  vinNumber: z.string().default(''),
  colorCode: z.string().default(''),
  categoryId: z.string().default(''),
  bodyType: z.string().default(''),
  fuelType: z.string().default(''),
  gearBox: z.string().default(''),
  vintageYear: z.number().nullable().default(null),
  importYear: z.number().nullable().default(null),
});

type MergeFormValues = z.infer<typeof mergeFormSchema>;

export const MergeCarsDialog = ({
  open,
  onOpenChange,
  cars,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cars: ICar[];
  categories: ICarCategory[];
}) => {
  const { t } = useTranslation('car');
  const { carsMerge, loading } = useCarMutations();
  const sourceCar = cars[0];
  const categoryOptions = buildCategoryOptions(categories);

  const form = useForm<MergeFormValues>({
    resolver: zodResolver(mergeFormSchema),
    defaultValues: {
      ownerId: sourceCar?.ownerId || '',
      description: sourceCar?.description || '',
      plateNumber: sourceCar?.plateNumber || '',
      vinNumber: sourceCar?.vinNumber || '',
      colorCode: sourceCar?.colorCode || '',
      categoryId: sourceCar?.categoryId || '',
      bodyType: sourceCar?.bodyType || '',
      fuelType: sourceCar?.fuelType || '',
      gearBox: sourceCar?.gearBox || '',
      vintageYear: sourceCar?.vintageYear || null,
      importYear: sourceCar?.importYear || null,
    },
  });

  useEffect(() => {
    form.reset({
      ownerId: sourceCar?.ownerId || '',
      description: sourceCar?.description || '',
      plateNumber: sourceCar?.plateNumber || '',
      vinNumber: sourceCar?.vinNumber || '',
      colorCode: sourceCar?.colorCode || '',
      categoryId: sourceCar?.categoryId || '',
      bodyType: sourceCar?.bodyType || '',
      fuelType: sourceCar?.fuelType || '',
      gearBox: sourceCar?.gearBox || '',
      vintageYear: sourceCar?.vintageYear || null,
      importYear: sourceCar?.importYear || null,
    });
  }, [form, open, sourceCar]);

  const onSubmit = (values: MergeFormValues) => {
    carsMerge({
      variables: {
        carIds: cars.map((car) => car._id),
        carFields: values,
      },
    }).then(() => onOpenChange(false));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.ContentCombined
        title={t('Merge cars', { defaultValue: 'Merge cars' })}
        description={t('Choose the values for the merged car.', {
          defaultValue: 'Choose the values for the merged car.',
        })}
        className="max-w-3xl"
      >
        <div className="rounded-lg border bg-sidebar/40 p-4">
          <div className="text-sm font-medium">
            {t('Merging these cars', { defaultValue: 'Merging these cars' })}
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {cars.map((car) => (
              <div
                key={car._id}
                className="rounded-md border bg-background p-3"
              >
                <div className="font-medium">{getCarDisplayName(car, t)}</div>
                <div className="text-sm text-muted-foreground">
                  {t('VIN: {{vin}}', {
                    vin: car.vinNumber || '—',
                    defaultValue: 'VIN: {{vin}}',
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('Category: {{category}}', {
                    category: car.category?.name || '—',
                    defaultValue: 'Category: {{category}}',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="plateNumber"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t('Plate number', { defaultValue: 'Plate number' })}
                    </Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="vinNumber"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t('VIN number', { defaultValue: 'VIN number' })}
                    </Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t('Category', { defaultValue: 'Category' })}
                    </Form.Label>
                    <Select
                      value={toSelectValue(field.value)}
                      onValueChange={(value) =>
                        field.onChange(fromSelectValue(value))
                      }
                    >
                      <Form.Control>
                        <Select.Trigger>
                          <Select.Value
                            placeholder={t('Choose category', {
                              defaultValue: 'Choose category',
                            })}
                          />
                        </Select.Trigger>
                      </Form.Control>
                      <Select.Content>
                        <Select.Item value={EMPTY_SELECT_VALUE}>
                          {t('No category', { defaultValue: 'No category' })}
                        </Select.Item>
                        {categoryOptions.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="bodyType"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t('Body type', { defaultValue: 'Body type' })}
                    </Form.Label>
                    <Select
                      value={toSelectValue(field.value)}
                      onValueChange={(value) =>
                        field.onChange(fromSelectValue(value))
                      }
                    >
                      <Form.Control>
                        <Select.Trigger>
                          <Select.Value
                            placeholder={t('Choose body type', {
                              defaultValue: 'Choose body type',
                            })}
                          />
                        </Select.Trigger>
                      </Form.Control>
                      <Select.Content>
                        {CAR_BODY_TYPE_OPTIONS.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            {getTranslatedLabel(option.label, t)}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="fuelType"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t('Fuel type', { defaultValue: 'Fuel type' })}
                    </Form.Label>
                    <Select
                      value={toSelectValue(field.value)}
                      onValueChange={(value) =>
                        field.onChange(fromSelectValue(value))
                      }
                    >
                      <Form.Control>
                        <Select.Trigger>
                          <Select.Value
                            placeholder={t('Choose fuel type', {
                              defaultValue: 'Choose fuel type',
                            })}
                          />
                        </Select.Trigger>
                      </Form.Control>
                      <Select.Content>
                        {CAR_FUEL_TYPE_OPTIONS.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            {getTranslatedLabel(option.label, t)}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="gearBox"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t('Gearbox', { defaultValue: 'Gearbox' })}
                    </Form.Label>
                    <Select
                      value={toSelectValue(field.value)}
                      onValueChange={(value) =>
                        field.onChange(fromSelectValue(value))
                      }
                    >
                      <Form.Control>
                        <Select.Trigger>
                          <Select.Value
                            placeholder={t('Choose gearbox', {
                              defaultValue: 'Choose gearbox',
                            })}
                          />
                        </Select.Trigger>
                      </Form.Control>
                      <Select.Content>
                        {CAR_GEARBOX_OPTIONS.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            {getTranslatedLabel(option.label, t)}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="vintageYear"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t('Vintage year', { defaultValue: 'Vintage year' })}
                    </Form.Label>
                    <Form.Control>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value
                              ? Number(event.target.value)
                              : null,
                          )
                        }
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="importYear"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t('Import year', { defaultValue: 'Import year' })}
                    </Form.Label>
                    <Form.Control>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value
                              ? Number(event.target.value)
                              : null,
                          )
                        }
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="colorCode"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t('Color', { defaultValue: 'Color' })}
                    </Form.Label>
                    <Form.Control>
                      <Input {...field} placeholder="#111827" />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t('Owner ID', { defaultValue: 'Owner ID' })}
                    </Form.Label>
                    <Form.Control>
                      <Input
                        {...field}
                        placeholder={t(
                          'Keep source owner or paste another owner ID',
                          {
                            defaultValue:
                              'Keep source owner or paste another owner ID',
                          },
                        )}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Form.Item className="md:col-span-2">
                    <Form.Label>
                      {t('Description', { defaultValue: 'Description' })}
                    </Form.Label>
                    <Form.Control>
                      <Textarea {...field} value={field.value || ''} rows={4} />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
            </div>

            <Dialog.Footer>
              <Dialog.Close asChild>
                <Button variant="secondary">
                  {t('Cancel', { defaultValue: 'Cancel' })}
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner containerClassName="flex-none" /> : null}
                {t('Merge cars', { defaultValue: 'Merge cars' })}
              </Button>
            </Dialog.Footer>
          </form>
        </Form>
      </Dialog.ContentCombined>
    </Dialog>
  );
};
