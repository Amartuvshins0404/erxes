import { useMutation, useQuery } from '@apollo/client';
import { Button, Input, Label, Select, Sheet, Spinner, Switch } from 'erxes-ui';
import { readImage } from 'erxes-ui/utils/core';
import { useEffect, useState } from 'react';
import {
  MTO_CATEGORY_CREATE,
  MTO_CATEGORY_UPDATE,
} from '@/category/graphql/categoryMutations';
import { MTO_CATEGORY } from '@/category/graphql/categoryQueries';
import { CategoryLevel } from '@/category/types/category';
import { isSubCategory } from '@/category/hooks/useCategoryOptions';
import { MtoUpload } from '~/components/onefit-upload';
import { useUploadConfig } from '@/config/hooks/useUploadConfig';

interface CategoryFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string | null;
  onSaved?: () => void;
}

const DEFAULT_FORM = {
  nameEn: '',
  nameMn: '',
  logo: '',
  level: 'main' as CategoryLevel,
  isActive: true,
};

export function CategoryFormSheet({
  open,
  onOpenChange,
  editId,
  onSaved,
}: CategoryFormSheetProps) {
  const isEdit = Boolean(editId);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const { uploadUrl } = useUploadConfig();

  const { data: editData, loading: editLoading } = useQuery(MTO_CATEGORY, {
    variables: { _id: editId ?? '' },
    skip: !editId || !open,
  });

  const [create, { loading: creating }] = useMutation(MTO_CATEGORY_CREATE);
  const [update, { loading: updating }] = useMutation(MTO_CATEGORY_UPDATE);

  const loading = creating || updating;

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
      setError(null);
      return;
    }

    if (editId && editData?.mtoAssociation) {
      const category = editData.mtoAssociation;

      setForm({
        nameEn: category.name?.en ?? '',
        nameMn: category.name?.mn ?? '',
        logo: category.logo ?? '',
        level: isSubCategory(category) ? 'sub' : 'main',
        isActive: category.isActive ?? true,
      });
    }
  }, [open, editId, editData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.nameEn.trim() || !form.nameMn.trim()) {
      setError('Name in both languages is required');
      return;
    }

    const variables = {
      name: { en: form.nameEn.trim(), mn: form.nameMn.trim() },
      logo: form.logo || undefined,
      level: form.level,
      isActive: form.isActive,
    };

    try {
      if (isEdit && editId) {
        await update({ variables: { _id: editId, ...variables } });
      } else {
        await create({ variables });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    }
  }

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
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-2">
                <Label>Level *</Label>
                <Select
                  value={form.level}
                  onValueChange={(value) =>
                    setForm({ ...form, level: value as CategoryLevel })
                  }
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="main">Main category</Select.Item>
                    <Select.Item value="sub">Sub category</Select.Item>
                  </Select.Content>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name (EN) *</Label>
                <Input
                  value={form.nameEn}
                  onChange={(e) =>
                    setForm({ ...form, nameEn: e.target.value })
                  }
                  placeholder="English name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Name (MN) *</Label>
                <Input
                  value={form.nameMn}
                  onChange={(e) =>
                    setForm({ ...form, nameMn: e.target.value })
                  }
                  placeholder="Монгол нэр"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <MtoUpload.Root
                  value={form.logo}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      logo: typeof v.url === 'string' ? v.url : form.logo,
                    })
                  }
                  uploadUrl={uploadUrl}
                >
                  <div className="flex items-center gap-3">
                    {form.logo && (
                      <img
                        src={readImage(form.logo)}
                        alt="Logo preview"
                        className="h-12 w-12 rounded object-cover border"
                      />
                    )}
                    <div className="flex flex-col gap-1">
                      <MtoUpload.Button variant="outline" size="sm" type="button">
                        {form.logo ? 'Change logo' : 'Upload logo'}
                      </MtoUpload.Button>
                      {form.logo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => setForm({ ...form, logo: '' })}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </MtoUpload.Root>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(value) =>
                    setForm({ ...form, isActive: value })
                  }
                />
                <Label>Active</Label>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
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
          )}
        </Sheet.Content>
      </Sheet.View>
    </Sheet>
  );
}
