import {
  Button,
  Checkbox,
  Dialog,
  Form,
  Input,
  Label,
  Spinner,
  Switch,
  Textarea,
  Upload,
} from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  useCreateCategory,
  useUpdateCategory,
} from '../hooks/useCategoryMutations';
import { ONE_FIT_ACTIVITY_CATEGORY } from '../graphql/categoryQueries';
import { SelectCategory } from './SelectCategory';

const categorySchema = z.object({
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
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryDialogProps {
  categoryId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  trigger?: React.ReactNode;
}

export function CategoryDialog({
  categoryId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onClose,
  trigger,
}: CategoryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isEditMode = !!categoryId;
  const isControlled = controlledOpen !== undefined;

  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? controlledOnOpenChange || (() => {})
    : setInternalOpen;

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && trigger && (
        <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      )}
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>
            {isEditMode ? 'Edit Category' : 'Create Category'}
          </Dialog.Title>
        </Dialog.Header>
        <CategoryForm
          categoryId={categoryId}
          onClose={handleClose}
          isEditMode={isEditMode}
        />
      </Dialog.Content>
    </Dialog>
  );
}

interface CategoryFormProps {
  categoryId?: string;
  onClose: () => void;
  isEditMode: boolean;
}

function CategoryForm({ categoryId, onClose, isEditMode }: CategoryFormProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'mn'>('en');
  const { data, loading: queryLoading } = useQuery(ONE_FIT_ACTIVITY_CATEGORY, {
    variables: { _id: categoryId },
    skip: !isEditMode || !categoryId,
  });

  const category = data?.oneFitActivityCategory;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: {
        en: '',
        mn: '',
      },
      description: {
        en: '',
        mn: '',
      },
      parentId: '',
      isActive: true,
      icon: '',
      image: '',
    },
  });

  useEffect(() => {
    if (category && isEditMode) {
      form.reset({
        name: category.name || { en: '', mn: '' },
        description: category.description || { en: '', mn: '' },
        parentId: category.parentId || '',
        isActive: category.isActive,
        icon: category.icon || '',
        image: category.image || '',
      });
      setSelectedLanguage('en');
    } else if (!isEditMode) {
      form.reset({
        name: {
          en: '',
          mn: '',
        },
        description: {
          en: '',
          mn: '',
        },
        parentId: '',
        isActive: true,
        icon: '',
        image: '',
      });
      setSelectedLanguage('en');
    }
  }, [category, isEditMode, form]);

  const { createCategory, loading: createLoading } = useCreateCategory();
  const { updateCategory, loading: updateLoading } = useUpdateCategory();
  const loading = createLoading || updateLoading;

  const onSubmit = (data: CategoryFormData) => {
    const variables = {
      name: data.name,
      description:
        data.description && (data.description.en || data.description.mn)
          ? data.description
          : undefined,
      parentId: data.parentId || undefined,
      isActive: data.isActive !== undefined ? data.isActive : true,
      icon: data.icon || undefined,
      image: data.image || undefined,
    };

    if (isEditMode && categoryId) {
      updateCategory({
        variables: {
          _id: categoryId,
          ...variables,
        },
        onCompleted: () => {
          onClose();
        },
      });
    } else {
      createCategory({
        variables,
        onCompleted: () => {
          onClose();
          form.reset();
        },
      });
    }
  };

  if (isEditMode && queryLoading) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
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
            <Form.Item className={selectedLanguage !== 'en' ? 'hidden' : ''}>
              <Form.Label>Name (English) *</Form.Label>
              <Form.Control>
                <Input
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  placeholder="Enter category name in English"
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
            <Form.Item className={selectedLanguage !== 'mn' ? 'hidden' : ''}>
              <Form.Label>Name (Mongolian) *</Form.Label>
              <Form.Control>
                <Input
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  placeholder="Enter category name in Mongolian"
                />
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
              <Form.Label>Parent Category</Form.Label>
              <Form.Control>
                <SelectCategory
                  selected={field.value}
                  onSelect={(value) => field.onChange(value || '')}
                  excludeId={isEditMode ? categoryId : undefined}
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
            <Form.Item className={selectedLanguage !== 'en' ? 'hidden' : ''}>
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
            <Form.Item className={selectedLanguage !== 'mn' ? 'hidden' : ''}>
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
        <Form.Field
          control={form.control}
          name="icon"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Icon</Form.Label>
              <Form.Control>
                <Upload.Root
                  value={field.value || ''}
                  onChange={(fileInfo: { url?: string } | string) => {
                    if (typeof fileInfo === 'string') {
                      field.onChange(fileInfo);
                    } else {
                      field.onChange(fileInfo.url || '');
                    }
                  }}
                >
                  {field.value ? (
                    <div className="flex items-center gap-2">
                      <Upload.Preview className="size-16 rounded" />
                      <Upload.Button variant="outline" size="sm">
                        Change
                      </Upload.Button>
                      <Upload.RemoveButton variant="outline" size="sm" />
                    </div>
                  ) : (
                    <Upload.Button variant="outline" size="sm">
                      Upload icon
                    </Upload.Button>
                  )}
                </Upload.Root>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="image"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Image</Form.Label>
              <Form.Control>
                <Upload.Root
                  value={field.value || ''}
                  onChange={(fileInfo: { url?: string } | string) => {
                    if (typeof fileInfo === 'string') {
                      field.onChange(fileInfo);
                    } else {
                      field.onChange(fileInfo.url || '');
                    }
                  }}
                >
                  {field.value ? (
                    <div className="flex items-center gap-2">
                      <Upload.Preview className="size-32 rounded" />
                      <Upload.Button variant="outline" size="sm">
                        Change
                      </Upload.Button>
                      <Upload.RemoveButton variant="outline" size="sm" />
                    </div>
                  ) : (
                    <Upload.Button variant="outline" size="sm">
                      Upload image
                    </Upload.Button>
                  )}
                </Upload.Root>
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
        <Dialog.Footer>
          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" size="lg" disabled={loading}>
            <Spinner show={loading} />
            {isEditMode ? 'Update Category' : 'Create Category'}
          </Button>
        </Dialog.Footer>
      </form>
    </Form>
  );
}
