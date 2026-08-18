import {
  Button,
  Checkbox,
  Sheet,
  Form,
  Input,
  Spinner,
  Select,
  Textarea,
  Switch,
  Label,
} from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { EnumCursorDirection, EnumCursorMode } from 'erxes-ui';
import {
  useCreateActivityType,
  useUpdateActivityType,
} from '../hooks/useActivityTypeMutations';
import { GenderRestriction } from '../types/activityType';
import { ONE_FIT_ACTIVITY_TYPE } from '../graphql/activityTypeQueries';
import { SelectCategories } from '~/modules/provider/components/SelectCategories';
import { SelectProviderSearchable } from '~/modules/provider/components/SelectProviderSearchable';
import { SelectProviderImage } from './SelectProviderImage';
import { ONE_FIT_ACTIVITY_CATEGORIES } from '~/modules/category/graphql/categoryQueries';
import { getLocalizedString as getCategoryLocalizedString } from '~/modules/category/utils/localization';
import { useOneFitMode } from '~/modules/config/hooks/useOneFitMode';

const baseActivityTypeSchema = z.object({
  name: z.object({
    en: z.string().min(1, { message: 'Name (English) is required' }),
    mn: z.string().min(1, { message: 'Name (Mongolian) is required' }),
  }),
  description: z
    .object({
      en: z.string().optional(),
      mn: z.string().optional(),
    })
    .optional(),
  creditCost: z
    .number()
    .min(0, { message: 'Credit cost must be 0 or greater' }),
  price: z
    .number()
    .min(0, { message: 'Price must be 0 or greater' })
    .optional(),
  duration: z
    .number()
    .min(1, { message: 'Duration must be at least 1 minute' }),
  genderRestriction: z.nativeEnum(GenderRestriction),
  categoryIds: z
    .array(z.string())
    .min(1, { message: 'At least one category is required' }),
  isActive: z.boolean().optional(),
  cancellationDeadline: z
    .number()
    .min(-24, { message: 'Cancellation deadline must be -24 or greater' })
    .optional(),
  singlePersonLimit: z
    .number()
    .min(1, { message: 'Single person limit must be at least 1' })
    .optional(),
  image: z.string().optional(),
});

const createActivityTypeSchema = baseActivityTypeSchema.extend({
  providerId: z.string().min(1, { message: 'Provider ID is required' }),
});

const editActivityTypeSchema = baseActivityTypeSchema.partial();

type CreateActivityTypeFormData = z.infer<typeof createActivityTypeSchema>;
type EditActivityTypeFormData = z.infer<typeof editActivityTypeSchema>;

interface ActivityTypeDialogProps {
  mode: 'create' | 'edit';
  activityTypeId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const ActivityTypeDialog = ({
  mode,
  activityTypeId,
  open,
  onOpenChange,
  onClose,
}: ActivityTypeDialogProps) => {
  const isCreate = mode === 'create';
  const [internalOpen, setInternalOpen] = useState(false);

  const effectiveOpen = open !== undefined ? open : internalOpen;
  const effectiveOnOpenChange =
    onOpenChange || ((newOpen: boolean) => setInternalOpen(newOpen));

  if (isCreate) {
    return (
      <Sheet open={effectiveOpen} onOpenChange={effectiveOnOpenChange}>
        <Sheet.Trigger asChild>
          <Button>
            <IconPlus />
            Create Activity Type
          </Button>
        </Sheet.Trigger>
        <Sheet.View className="sm:max-w-2xl">
          <Sheet.Header>
            <Sheet.Title>Create Activity Type</Sheet.Title>
            <Sheet.Close />
          </Sheet.Header>
          <ActivityTypeForm
            mode="create"
            onClose={() => {
              effectiveOnOpenChange(false);
              onClose?.();
            }}
          />
        </Sheet.View>
      </Sheet>
    );
  }

  return (
    <Sheet open={effectiveOpen} onOpenChange={effectiveOnOpenChange}>
      <Sheet.View className="sm:max-w-2xl h-full">
        <Sheet.Header>
          <Sheet.Title>Edit Activity Type</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <ActivityTypeForm
          mode="edit"
          activityTypeId={activityTypeId!}
          onClose={() => {
            effectiveOnOpenChange(false);
            onClose?.();
          }}
        />
      </Sheet.View>
    </Sheet>
  );
};

interface ActivityTypeFormProps {
  mode: 'create' | 'edit';
  activityTypeId?: string;
  onClose: () => void;
}

const ActivityTypeForm = ({
  mode,
  activityTypeId,
  onClose,
}: ActivityTypeFormProps) => {
  const { isSlaveMode } = useOneFitMode();
  const isCreate = mode === 'create';
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'mn'>('en');

  const { data: activityTypeData, loading: queryLoading } = useQuery(
    ONE_FIT_ACTIVITY_TYPE,
    {
      variables: { _id: activityTypeId },
      skip: isCreate || !activityTypeId,
    },
  );

  const { data: categoriesData } = useQuery(ONE_FIT_ACTIVITY_CATEGORIES, {
    variables: {},
  });

  const activityType = activityTypeData?.oneFitActivityType;
  const categories = categoriesData?.oneFitActivityCategories || [];

  const getCategoryFullPath = (
    categoryId: string,
    categoriesList: Array<{
      _id: string;
      parentId?: string;
      name: { en: string; mn: string };
    }>,
  ): string => {
    const categoryMap = new Map(categoriesList.map((cat) => [cat._id, cat]));

    const getPath = (id: string, path: string[] = []): string[] => {
      const cat = categoryMap.get(id);
      if (!cat) return path;

      const currentName = getCategoryLocalizedString(cat.name, 'en');
      const newPath = [currentName, ...path];

      if (cat.parentId) {
        return getPath(cat.parentId, newPath);
      }

      return newPath;
    };

    const path = getPath(categoryId);
    return path.join(' > ');
  };

  const form = useForm<CreateActivityTypeFormData | EditActivityTypeFormData>({
    resolver: zodResolver(
      isCreate ? createActivityTypeSchema : editActivityTypeSchema,
    ),
    defaultValues: {
      name: {
        en: '',
        mn: '',
      },
      description: {
        en: '',
        mn: '',
      },
      creditCost: 0,
      price: 0,
      duration: 60,
      genderRestriction: GenderRestriction.MIXED,
      categoryIds: [],
      isActive: true,
      cancellationDeadline: 0,
      singlePersonLimit: 5,
      image: '',
      ...(isCreate && { providerId: '' }),
    },
  });

  const providerId = isCreate
    ? form.watch('providerId')
    : activityType?.providerId;

  useEffect(() => {
    if (!isCreate && activityType) {
      form.reset({
        name: activityType.name,
        description: activityType.description || { en: '', mn: '' },
        creditCost: activityType.creditCost,
        price: activityType.price ?? 0,
        duration: activityType.duration,
        genderRestriction: activityType.genderRestriction,
        categoryIds: activityType.categoryIds || [],
        isActive: activityType.isActive,
        cancellationDeadline: activityType.cancellationDeadline || 0,
        singlePersonLimit: activityType.singlePersonLimit ?? 5,
        image: activityType.image || '',
      });
    }
  }, [activityType, isCreate, form]);

  useEffect(() => {
    if (isCreate && providerId) {
      form.setValue('image', '');
    }
  }, [providerId, isCreate, form]);

  const { createActivityType, loading: createLoading } =
    useCreateActivityType();
  const { updateActivityType, loading: updateLoading } =
    useUpdateActivityType();

  const loading = isCreate ? createLoading : updateLoading;

  const onSubmit = (
    data: CreateActivityTypeFormData | EditActivityTypeFormData,
  ) => {
    if (isCreate) {
      const createData = data as CreateActivityTypeFormData;
      createActivityType({
        variables: {
          providerId: createData.providerId,
          name: createData.name,
          description:
            createData.description &&
            (createData.description.en || createData.description.mn)
              ? createData.description
              : undefined,
          creditCost: createData.creditCost,
          price: createData.price ?? 0,
          duration: createData.duration,
          genderRestriction: createData.genderRestriction,
          categoryIds: createData.categoryIds,
          isActive:
            createData.isActive !== undefined ? createData.isActive : true,
          cancellationDeadline: createData.cancellationDeadline,
          singlePersonLimit: createData.singlePersonLimit ?? 5,
          image: createData.image || undefined,
        },
        onCompleted: () => {
          onClose();
          form.reset();
        },
      });
    } else {
      const editData = data as EditActivityTypeFormData;
      updateActivityType({
        variables: {
          _id: activityTypeId!,
          name: editData.name,
          description:
            editData.description &&
            (editData.description.en || editData.description.mn)
              ? editData.description
              : undefined,
          creditCost: editData.creditCost,
          price: editData.price,
          duration: editData.duration,
          genderRestriction: editData.genderRestriction,
          categoryIds:
            editData.categoryIds && editData.categoryIds.length > 0
              ? editData.categoryIds
              : undefined,
          isActive: editData.isActive,
          cancellationDeadline: editData.cancellationDeadline,
          singlePersonLimit: editData.singlePersonLimit,
          image: editData.image || undefined,
        },
        onCompleted: () => {
          onClose();
        },
      });
    }
  };

  if (!isCreate && queryLoading) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full overflow-hidden"
      >
        <Sheet.Content className="flex-auto overflow-y-auto">
          <div className="flex flex-col gap-6 p-5">
            {isCreate && (
              <Form.Field
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Provider *</Form.Label>
                    <Form.Control>
                      <SelectProviderSearchable.FormItem
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
            )}
            <div className="flex items-center justify-between gap-4 pb-2">
              <Label className="text-sm font-medium">Language</Label>
              <div className="flex items-center gap-3">
                <Label
                  htmlFor="language-switch"
                  className={`text-sm ${
                    selectedLanguage === 'en'
                      ? 'font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  English
                </Label>
                <Switch
                  id="language-switch"
                  checked={selectedLanguage === 'mn'}
                  onCheckedChange={(checked) =>
                    setSelectedLanguage(checked ? 'mn' : 'en')
                  }
                />
                <Label
                  htmlFor="language-switch"
                  className={`text-sm ${
                    selectedLanguage === 'mn'
                      ? 'font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  Mongolian
                </Label>
              </div>
            </div>
            <Form.Field
              control={form.control}
              name="name.en"
              render={({ field }) => (
                <Form.Item
                  className={selectedLanguage !== 'en' ? 'hidden' : ''}
                >
                  <Form.Label>Name (English) *</Form.Label>
                  <Form.Control>
                    <Input
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Enter activity name in English"
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="name.mn"
              render={({ field }) => (
                <Form.Item
                  className={selectedLanguage !== 'mn' ? 'hidden' : ''}
                >
                  <Form.Label>Name (Mongolian) *</Form.Label>
                  <Form.Control>
                    <Input
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Enter activity name in Mongolian"
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="description.en"
              render={({ field }) => (
                <Form.Item
                  className={selectedLanguage !== 'en' ? 'hidden' : ''}
                >
                  <Form.Label>Description (English)</Form.Label>
                  <Form.Control>
                    <Textarea
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Enter description in English"
                      rows={3}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="description.mn"
              render={({ field }) => (
                <Form.Item
                  className={selectedLanguage !== 'mn' ? 'hidden' : ''}
                >
                  <Form.Label>Description (Mongolian)</Form.Label>
                  <Form.Control>
                    <Textarea
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      placeholder="Enter description in Mongolian"
                      rows={3}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <Form.Field
                control={form.control}
                name="creditCost"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Credit Cost *</Form.Label>
                    <Form.Control>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Enter credit cost"
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : 0,
                          )
                        }
                        disabled={isSlaveMode}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="price"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Price</Form.Label>
                    <Form.Control>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Enter price"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : 0,
                          )
                        }
                        disabled={isSlaveMode}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Duration (minutes) *</Form.Label>
                    <Form.Control>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        placeholder="Enter duration in minutes"
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value, 10) : 0,
                          )
                        }
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
            </div>
            <Form.Field
              control={form.control}
              name="genderRestriction"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Gender Restriction *</Form.Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <Form.Control>
                      <Select.Trigger>
                        <Select.Value placeholder="Select gender restriction" />
                      </Select.Trigger>
                    </Form.Control>
                    <Select.Content>
                      <Select.Item value={GenderRestriction.MIXED}>
                        Mixed
                      </Select.Item>
                      <Select.Item value={GenderRestriction.MALE}>
                        Male
                      </Select.Item>
                      <Select.Item value={GenderRestriction.FEMALE}>
                        Female
                      </Select.Item>
                    </Select.Content>
                  </Select>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="categoryIds"
              render={({ field }) => {
                const selectedCategoryIds = field.value || [];
                const selectedCategories = categories.filter(
                  (cat: {
                    _id: string;
                    parentId?: string;
                    name: { en: string; mn: string };
                  }) => selectedCategoryIds.includes(cat._id),
                );

                return (
                  <Form.Item>
                    <Form.Label>Categories *</Form.Label>
                    <Form.Control>
                      <SelectCategories
                        selected={selectedCategoryIds}
                        onSelect={field.onChange}
                      />
                    </Form.Control>
                    {selectedCategories.length > 0 && (
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-2">
                          Selected Categories:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCategories.map(
                            (category: {
                              _id: string;
                              parentId?: string;
                              name: { en: string; mn: string };
                            }) => (
                              <span
                                key={category._id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground"
                              >
                                {getCategoryFullPath(category._id, categories)}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                    <Form.Message />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="image"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Image</Form.Label>
                  <Form.Control>
                    <SelectProviderImage
                      providerId={providerId}
                      selectedImage={field.value}
                      onSelect={field.onChange}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="cancellationDeadline"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Cancellation Deadline (hours)</Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      type="number"
                      min="-24"
                      step="0.5"
                      placeholder="Hours before activity start when cancellation is allowed"
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseFloat(e.target.value) : 0,
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
              name="singlePersonLimit"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Single Person Limit</Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      placeholder="Max bookings per person (default 5)"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseInt(e.target.value, 10)
                            : undefined,
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
              name="isActive"
              render={({ field }) => (
                <Form.Item className="flex flex-row items-center space-x-2 space-y-0">
                  <Form.Control>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Form.Control>
                  <Form.Label variant="peer">Active</Form.Label>
                  <Form.Message />
                </Form.Item>
              )}
            />
          </div>
        </Sheet.Content>
        <Sheet.Footer className="flex justify-end shrink-0 p-2.5 gap-1 bg-muted">
          {!isCreate && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size={isCreate ? 'lg' : 'default'}
            disabled={loading}
          >
            <Spinner show={loading} />
            {isCreate ? 'Create Activity Type' : 'Update Activity Type'}
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};

// Export convenience components for backward compatibility
export const CreateActivityTypeDialog = () => {
  const [open, setOpen] = useState(false);
  return (
    <ActivityTypeDialog
      mode="create"
      open={open}
      onOpenChange={setOpen}
      onClose={() => setOpen(false)}
    />
  );
};

export const EditActivityTypeDialog = ({
  activityTypeId,
  open,
  onOpenChange,
  onClose,
}: {
  activityTypeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}) => (
  <ActivityTypeDialog
    mode="edit"
    activityTypeId={activityTypeId}
    open={open}
    onOpenChange={onOpenChange}
    onClose={onClose}
  />
);
