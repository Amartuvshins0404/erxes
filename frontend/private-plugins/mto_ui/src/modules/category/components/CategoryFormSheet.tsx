import { useMutation, useQuery } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Form,
  Input,
  Select,
  Sheet,
  Spinner,
  Switch,
  toast,
} from 'erxes-ui';
import { readImage } from 'erxes-ui/utils/core';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  MTO_CATEGORY_CREATE,
  MTO_CATEGORY_UPDATE,
} from '@/category/graphql/categoryMutations';
import { MTO_CATEGORY } from '@/category/graphql/categoryQueries';
import {
  CategoryFormData,
  categoryFormSchema,
} from '@/category/constants/categorySchema';
import { isSubCategory } from '@/category/hooks/useCategoryOptions';
import { useUploadConfig } from '@/config/hooks/useUploadConfig';
import { MtoUpload } from '~/components/MtoUpload';

interface CategoryFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string | null;
  onSaved?: () => void;
}

const DEFAULT_VALUES: CategoryFormData = {
  nameEn: '',
  nameMn: '',
  logo: '',
  level: 'main',
  isActive: true,
};

export function CategoryFormSheet({
  open,
  onOpenChange,
  editId,
  onSaved,
}: CategoryFormSheetProps) {
  const isEdit = Boolean(editId);
  const { uploadUrl } = useUploadConfig();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { data: editData, loading: editLoading } = useQuery(MTO_CATEGORY, {
    variables: { _id: editId ?? '' },
    skip: !editId || !open,
  });

  const [create, { loading: creating }] = useMutation(MTO_CATEGORY_CREATE);
  const [update, { loading: updating }] = useMutation(MTO_CATEGORY_UPDATE);
  const loading = creating || updating;

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (editId && editData?.mtoCategory) {
      const category = editData.mtoCategory;
      form.reset({
        nameEn: category.name?.en ?? '',
        nameMn: category.name?.mn ?? '',
        logo: category.logo ?? '',
        level: isSubCategory(category) ? 'sub' : 'main',
        isActive: category.isActive ?? true,
      });
    }
  }, [open, editId, editData, form]);

  const onSubmit = async (data: CategoryFormData) => {
    const variables = {
      name: { en: data.nameEn.trim(), mn: data.nameMn.trim() },
      logo: data.logo || undefined,
      level: data.level,
      isActive: data.isActive,
    };

    try {
      if (isEdit && editId) {
        await update({ variables: { _id: editId, ...variables } });
      } else {
        await create({ variables });
      }

      toast({
        title: 'Success',
        description: isEdit ? 'Category updated' : 'Category created',
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to save category',
        variant: 'destructive',
      });
    }
  };

  const logo = form.watch('logo');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Sheet.View className="sm:max-w-lg">
        <Sheet.Header>
          <Sheet.Title>{isEdit ? 'Edit Category' : 'New Category'}</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content className="overflow-y-auto flex-1">
          {editLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="p-5 space-y-4"
              >
                <Form.Field
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Level *</Form.Label>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <Form.Control>
                          <Select.Trigger>
                            <Select.Value />
                          </Select.Trigger>
                        </Form.Control>
                        <Select.Content>
                          <Select.Item value="main">Main category</Select.Item>
                          <Select.Item value="sub">Sub category</Select.Item>
                        </Select.Content>
                      </Select>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Name (EN) *</Form.Label>
                      <Form.Control>
                        <Input {...field} placeholder="English name" />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="nameMn"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Name (MN) *</Form.Label>
                      <Form.Control>
                        <Input {...field} placeholder="Монгол нэр" />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Logo</Form.Label>
                      <MtoUpload.Root
                        value={field.value || ''}
                        onChange={(v) =>
                          field.onChange(
                            typeof v.url === 'string' ? v.url : field.value,
                          )
                        }
                        uploadUrl={uploadUrl}
                      >
                        <div className="flex items-center gap-3">
                          {logo ? (
                            <img
                              src={readImage(logo)}
                              alt="Logo preview"
                              className="h-12 w-12 rounded object-cover border"
                            />
                          ) : null}
                          <div className="flex flex-col gap-1">
                            <MtoUpload.Button
                              variant="outline"
                              size="sm"
                              type="button"
                            >
                              {logo ? 'Change logo' : 'Upload logo'}
                            </MtoUpload.Button>
                            {logo ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground"
                                onClick={() => field.onChange('')}
                              >
                                Remove
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </MtoUpload.Root>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <Form.Item className="flex items-center gap-3">
                      <Form.Control>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </Form.Control>
                      <Form.Label className="!mt-0">Active</Form.Label>
                    </Form.Item>
                  )}
                />
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={loading}>
                    {isEdit ? 'Save' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </Sheet.Content>
      </Sheet.View>
    </Sheet>
  );
}
