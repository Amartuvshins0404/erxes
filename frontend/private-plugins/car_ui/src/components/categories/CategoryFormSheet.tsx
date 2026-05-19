import { useEffect, useMemo } from 'react';
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
import { IconTrash, IconUpload } from '@tabler/icons-react';
import { SelectCategory } from 'ui-modules';
import { useTranslation } from 'react-i18next';

import { buildCategoryOptions } from '~/lib/categoryTree';
import {
  EMPTY_SELECT_VALUE,
  fromSelectValue,
  toSelectValue,
} from '~/lib/constants';
import { stripTypename } from '~/lib/stripTypename';
import { useCarMutations } from '~/hooks/useCarMutations';
import { IAttachment, ICarCategory } from '~/types/car';

type CategoryFormValues = {
  name: string;
  code: string;
  description: string;
  parentId: string;
  image?: IAttachment | null;
  secondaryImages: IAttachment[];
  productCategoryId: string;
};

export const CategoryFormSheet = ({
  open,
  onOpenChange,
  category,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ICarCategory | null;
  categories: ICarCategory[];
}) => {
  const { t } = useTranslation('car');
  const { carCategoriesAdd, carCategoriesEdit, loading } = useCarMutations();
  const categoryFormSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .min(1, t('Name is required', { defaultValue: 'Name is required' })),
        code: z
          .string()
          .min(1, t('Code is required', { defaultValue: 'Code is required' })),
        description: z.string().default(''),
        parentId: z.string().default(''),
        image: z.custom<IAttachment | null>().nullable().optional(),
        secondaryImages: z.array(z.custom<IAttachment>()).default([]),
        productCategoryId: z.string().default(''),
      }),
    [t],
  );

  const options = useMemo(
    () => buildCategoryOptions(categories, category?._id),
    [categories, category?._id],
  );

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || '',
      code: category?.code || '',
      description: category?.description || '',
      parentId: category?.parentId || '',
      image: stripTypename(category?.image || null),
      secondaryImages: stripTypename(category?.secondaryImages || []),
      productCategoryId: category?.productCategoryId || '',
    },
  });

  useEffect(() => {
    form.reset({
      name: category?.name || '',
      code: category?.code || '',
      description: category?.description || '',
      parentId: category?.parentId || '',
      image: stripTypename(category?.image || null),
      secondaryImages: stripTypename(category?.secondaryImages || []),
      productCategoryId: category?.productCategoryId || '',
    });
  }, [category, form, open]);

  const onSubmit = (values: CategoryFormValues) => {
    const variables = {
      ...values,
      image: values.image ? stripTypename(values.image) : null,
      secondaryImages: values.secondaryImages.map((image) =>
        stripTypename(image),
      ),
    };

    const mutation = category?._id
      ? carCategoriesEdit({
          variables: {
            _id: category._id,
            ...variables,
          },
        })
      : carCategoriesAdd({ variables });

    mutation.then(() => onOpenChange(false));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Sheet.View className="p-0 sm:max-w-2xl">
        <Sheet.Header className="gap-3">
          <div>
            <Sheet.Title>
              {category?._id
                ? t('Edit category', { defaultValue: 'Edit category' })
                : t('Add category', { defaultValue: 'Add category' })}
            </Sheet.Title>
            <Sheet.Description>
              {t('Create or update a car category.', {
                defaultValue: 'Create or update a car category.',
              })}
            </Sheet.Description>
          </div>
          <Sheet.Close />
        </Sheet.Header>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <Sheet.Content className="min-h-0 overflow-hidden rounded-none">
              <ScrollArea className="h-full">
                <div className="grid gap-6 p-5 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>
                          {t('Name', { defaultValue: 'Name' })}
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
                    name="code"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>
                          {t('Code', { defaultValue: 'Code' })}
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
                    name="parentId"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>
                          {t('Parent category', {
                            defaultValue: 'Parent category',
                          })}
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
                                placeholder={t('No parent', {
                                  defaultValue: 'No parent',
                                })}
                              />
                            </Select.Trigger>
                          </Form.Control>
                          <Select.Content>
                            <Select.Item value={EMPTY_SELECT_VALUE}>
                              {t('No parent', { defaultValue: 'No parent' })}
                            </Select.Item>
                            {options.map((option) => (
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
                    name="productCategoryId"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>
                          {t('Product category', {
                            defaultValue: 'Product category',
                          })}
                        </Form.Label>
                        <SelectCategory
                          selected={field.value}
                          onSelect={(value) => field.onChange(value || '')}
                        />
                        <Form.Message />
                      </Form.Item>
                    )}
                  />

                  <Form.Field
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <Form.Item className="md:col-span-2">
                        <Form.Label>
                          {t('Image', { defaultValue: 'Image' })}
                        </Form.Label>
                        <Upload.Root
                          value={field.value?.url || ''}
                          onChange={(fileInfo: { url?: string } | string) => {
                            if (typeof fileInfo === 'string') {
                              field.onChange({ url: fileInfo });
                              return;
                            }

                            field.onChange(fileInfo as IAttachment);
                          }}
                          className="items-center gap-3"
                        >
                          <Upload.Preview className="size-24 rounded-lg" />
                          <div className="flex gap-2">
                            <Upload.Button variant="secondary" size="sm">
                              <IconUpload className="size-4" />
                              {t('Upload image', {
                                defaultValue: 'Upload image',
                              })}
                            </Upload.Button>
                            {field.value?.url ? (
                              <Upload.RemoveButton
                                variant="destructive"
                                size="sm"
                              >
                                <IconTrash className="size-4" />
                                {t('Remove', { defaultValue: 'Remove' })}
                              </Upload.RemoveButton>
                            ) : null}
                          </div>
                        </Upload.Root>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />

                  <Form.Field
                    control={form.control}
                    name="secondaryImages"
                    render={({ field }) => (
                      <Form.Item className="md:col-span-2">
                        <Form.Label>
                          {t('Secondary images', {
                            defaultValue: 'Secondary images',
                          })}
                        </Form.Label>
                        <Upload.Root
                          value=""
                          multiple
                          onChange={(fileInfo: { url?: string } | string) => {
                            if (typeof fileInfo === 'string') {
                              field.onChange([
                                ...(field.value || []),
                                { url: fileInfo },
                              ]);
                              return;
                            }

                            field.onChange([
                              ...(field.value || []),
                              stripTypename(fileInfo as IAttachment),
                            ]);
                          }}
                          className="flex-col"
                        >
                          <div className="flex flex-wrap gap-3">
                            {(field.value || []).map((image, index) => (
                              <div
                                key={`${image.url || 'image'}-${index}`}
                                className="group relative size-24 overflow-hidden rounded-lg border bg-muted"
                              >
                                {image.url ? (
                                  <img
                                    src={image.url}
                                    alt={
                                      image.name ||
                                      t('Secondary image {{index}}', {
                                        index: index + 1,
                                        defaultValue:
                                          'Secondary image {{index}}',
                                      })
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : null}
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                                  onClick={() =>
                                    field.onChange(
                                      (field.value || []).filter(
                                        (_, imageIndex) =>
                                          imageIndex !== index,
                                      ),
                                    )
                                  }
                                >
                                  <IconTrash className="size-4" />
                                </Button>
                              </div>
                            ))}
                            <Upload.Button
                              variant="outline"
                              size="sm"
                              type="button"
                            >
                              <IconUpload className="size-4" />
                              {t('Add image', { defaultValue: 'Add image' })}
                            </Upload.Button>
                          </div>
                          <div className="hidden">
                            <Upload.Preview />
                          </div>
                        </Upload.Root>
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
                            rows={4}
                            placeholder={t(
                              'Describe what belongs in this category.',
                              {
                                defaultValue:
                                  'Describe what belongs in this category.',
                              },
                            )}
                          />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                </div>
              </ScrollArea>
            </Sheet.Content>

            <Sheet.Footer className="border-t">
              <Sheet.Close asChild>
                <Button variant="secondary">
                  {t('Cancel', { defaultValue: 'Cancel' })}
                </Button>
              </Sheet.Close>
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner containerClassName="flex-none" /> : null}
                {category?._id
                  ? t('Save changes', { defaultValue: 'Save changes' })
                  : t('Create category', { defaultValue: 'Create category' })}
              </Button>
            </Sheet.Footer>
          </form>
        </Form>
      </Sheet.View>
    </Sheet>
  );
};
