import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Form,
  Input,
  ScrollArea,
  Select,
  Sheet,
  Spinner,
  Textarea,
  Upload,
} from 'erxes-ui';
import { IconCircleFilled, IconTrash, IconUpload } from '@tabler/icons-react';
import { SelectMember } from 'ui-modules';
import { useTranslation } from 'react-i18next';

import {
  CAR_BODY_TYPE_OPTIONS,
  CAR_COLORS,
  CAR_FUEL_TYPE_OPTIONS,
  CAR_GEARBOX_OPTIONS,
  EMPTY_SELECT_VALUE,
  fromSelectValue,
  toSelectValue,
} from '~/lib/constants';
import { buildCategoryOptions } from '~/lib/categoryTree';
import { getTranslatedLabel } from '~/lib/car';
import { stripTypename } from '~/lib/stripTypename';
import { useCarMutations } from '~/hooks/useCarMutations';
import { IAttachment, ICar, ICarCategory } from '~/types/car';

const carFormSchema = z.object({
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
  attachment: z.custom<IAttachment | null>().nullable().optional(),
});

type CarFormValues = z.infer<typeof carFormSchema>;

const AttachmentField = ({
  value,
  onChange,
}: {
  value?: IAttachment | null;
  onChange: (value?: IAttachment | null) => void;
}) => {
  const { t } = useTranslation('car');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Upload.Root
      value={value?.url || ''}
      onChange={(fileInfo: { url?: string } | string) => {
        if (typeof fileInfo === 'string') {
          onChange({ url: fileInfo });
          return;
        }

        onChange(fileInfo as IAttachment);
      }}
      className="group relative block w-full"
    >
      <Upload.Button
        type="button"
        variant="secondary"
        size={null}
        className="relative flex h-32 min-h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed bg-background p-0 text-center whitespace-normal"
        style={
          value?.url
            ? {
                backgroundImage: `url(${value.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {!value?.url ? (
          <div className="flex flex-col items-center gap-2 px-4 text-muted-foreground">
            {isLoading ? (
              <Spinner size="sm" />
            ) : (
              <IconUpload className="size-5" />
            )}
            <span>
              {t('Upload featured image', {
                defaultValue: 'Upload featured image',
              })}
            </span>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
            {t('Change image', { defaultValue: 'Change image' })}
          </div>
        )}
      </Upload.Button>

      {value?.url ? (
        <Upload.RemoveButton
          type="button"
          variant="destructive"
          size="sm"
          className="absolute right-2 top-2"
        >
          <IconTrash className="size-4" />
        </Upload.RemoveButton>
      ) : null}

      <div className="hidden">
        <Upload.Preview
          onUploadStart={() => setIsLoading(true)}
          onAllUploadsComplete={() => setIsLoading(false)}
        />
      </div>
    </Upload.Root>
  );
};

export const CarFormSheet = ({
  open,
  onOpenChange,
  car,
  categories,
  onCompleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car?: ICar | null;
  categories: ICarCategory[];
  onCompleted?: (car: ICar) => void;
}) => {
  const { t } = useTranslation('car');
  const { carsAdd, carsEdit, loading } = useCarMutations();
  const nowYear = new Date().getFullYear();
  const categoryOptions = useMemo(
    () => buildCategoryOptions(categories),
    [categories],
  );

  const form = useForm<CarFormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      ownerId: car?.ownerId || '',
      description: car?.description || '',
      plateNumber: car?.plateNumber || '',
      vinNumber: car?.vinNumber || '',
      colorCode: car?.colorCode || '',
      categoryId: car?.categoryId || '',
      bodyType: car?.bodyType || '',
      fuelType: car?.fuelType || '',
      gearBox: car?.gearBox || '',
      vintageYear: car?.vintageYear || nowYear,
      importYear: car?.importYear || nowYear,
      attachment: stripTypename(car?.attachment || null),
    },
  });

  useEffect(() => {
    form.reset({
      ownerId: car?.ownerId || '',
      description: car?.description || '',
      plateNumber: car?.plateNumber || '',
      vinNumber: car?.vinNumber || '',
      colorCode: car?.colorCode || '',
      categoryId: car?.categoryId || '',
      bodyType: car?.bodyType || '',
      fuelType: car?.fuelType || '',
      gearBox: car?.gearBox || '',
      vintageYear: car?.vintageYear || nowYear,
      importYear: car?.importYear || nowYear,
      attachment: stripTypename(car?.attachment || null),
    });
  }, [car, form, nowYear, open]);

  const onSubmit = (values: CarFormValues) => {
    const variables = {
      ...values,
      attachment: values.attachment ? stripTypename(values.attachment) : null,
    };

    const mutation = car?._id
      ? carsEdit({
          variables: {
            _id: car._id,
            ...variables,
          },
        })
      : carsAdd({ variables });

    mutation.then((result) => {
      const savedCar = car?._id ? result.data?.carsEdit : result.data?.carsAdd;

      if (savedCar) {
        onCompleted?.(savedCar);
      }

      onOpenChange(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Sheet.View className="p-0 sm:max-w-4xl">
        <Sheet.Header>
          <Sheet.Title>
            {car?._id
              ? t('Edit car', { defaultValue: 'Edit car' })
              : t('Add car', { defaultValue: 'Add car' })}
          </Sheet.Title>
          <Sheet.Description className="sr-only">
            {t('Create or update a car record.', {
              defaultValue: 'Create or update a car record.',
            })}
          </Sheet.Description>
          <Sheet.Close />
        </Sheet.Header>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-auto flex-col overflow-hidden"
          >
            <Sheet.Content className="min-h-0 flex-auto overflow-hidden">
              <ScrollArea className="h-full">
                <div className="grid gap-6 p-6 pb-24 md:grid-cols-2">
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
                              {t('No category', {
                                defaultValue: 'No category',
                              })}
                            </Select.Item>
                            {categoryOptions.map((option) => (
                              <Select.Item
                                key={option.value}
                                value={option.value}
                              >
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
                    name="ownerId"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>
                          {t('Owner', { defaultValue: 'Owner' })}
                        </Form.Label>
                        <SelectMember.FormItem
                          value={field.value}
                          onValueChange={(value) => field.onChange(value || '')}
                          mode="single"
                          placeholder={t('Select owner', {
                            defaultValue: 'Select owner',
                          })}
                        />
                        <Form.Message />
                      </Form.Item>
                    )}
                  />

                  <Form.Field
                    control={form.control}
                    name="plateNumber"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>
                          {t('Plate number', { defaultValue: 'Plate number' })}
                        </Form.Label>
                        <Form.Control>
                          <Input {...field} placeholder="e.g. UNA 1234" />
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
                          <Input
                            {...field}
                            placeholder={t('Vehicle identification number', {
                              defaultValue: 'Vehicle identification number',
                            })}
                          />
                        </Form.Control>
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
                            value={field.value ?? ''}
                            type="number"
                            min={1950}
                            max={nowYear}
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
                            value={field.value ?? ''}
                            type="number"
                            min={1950}
                            max={nowYear}
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
                              <Select.Item
                                key={option.value}
                                value={option.value}
                              >
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
                              <Select.Item
                                key={option.value}
                                value={option.value}
                              >
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
                              <Select.Item
                                key={option.value}
                                value={option.value}
                              >
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
                    name="colorCode"
                    render={({ field }) => (
                      <Form.Item className="md:col-span-2">
                        <Form.Label>
                          {t('Color', { defaultValue: 'Color' })}
                        </Form.Label>
                        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-3">
                          {CAR_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                                field.value === color
                                  ? 'border-primary ring-2 ring-primary/30'
                                  : 'border-border'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => field.onChange(color)}
                            >
                              {field.value === color ? (
                                <IconCircleFilled
                                  className={`size-3 ${
                                    color === '#f8fafc'
                                      ? 'text-foreground'
                                      : 'text-white'
                                  }`}
                                />
                              ) : null}
                            </button>
                          ))}
                          <div className="ml-auto flex min-w-56 items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {t('Hex', { defaultValue: 'Hex' })}
                            </span>
                            <Input
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="#111827"
                            />
                          </div>
                        </div>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />

                  <Form.Field
                    control={form.control}
                    name="attachment"
                    render={({ field }) => (
                      <Form.Item className="md:col-span-2">
                        <Form.Label>
                          {t('Featured image', {
                            defaultValue: 'Featured image',
                          })}
                        </Form.Label>
                        <Form.Control>
                          <AttachmentField
                            value={field.value}
                            onChange={(nextValue) =>
                              field.onChange(stripTypename(nextValue || null))
                            }
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
                          <Textarea
                            {...field}
                            value={field.value || ''}
                            placeholder={t(
                              'Add service notes, condition, or anything useful for the team.',
                              {
                                defaultValue:
                                  'Add service notes, condition, or anything useful for the team.',
                              },
                            )}
                            rows={5}
                          />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                </div>
              </ScrollArea>
            </Sheet.Content>

            <Sheet.Footer className="flex-none">
              <Sheet.Close asChild>
                <Button variant="secondary">
                  {t('Cancel', { defaultValue: 'Cancel' })}
                </Button>
              </Sheet.Close>
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner containerClassName="flex-none" /> : null}
                {car?._id
                  ? t('Save changes', { defaultValue: 'Save changes' })
                  : t('Create car', { defaultValue: 'Create car' })}
              </Button>
            </Sheet.Footer>
          </form>
        </Form>
      </Sheet.View>
    </Sheet>
  );
};
