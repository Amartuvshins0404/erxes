import { useMutation, useQuery } from '@apollo/client';
import { Button, Input, Label, Sheet, Spinner, Switch } from 'erxes-ui';
import { readImage } from 'erxes-ui/utils/core';
import { useEffect, useState } from 'react';
import {
  MTO_ASSOCIATION_CREATE,
  MTO_ASSOCIATION_UPDATE,
} from '@/association/graphql/associationMutations';
import { MTO_ASSOCIATION } from '@/association/graphql/associationQueries';
import { MtoUpload } from '~/components/onefit-upload';
import { useUploadConfig } from '@/config/hooks/useUploadConfig';

interface AssociationFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string | null;
  onSaved?: () => void;
}

const DEFAULT_FORM = {
  nameEn: '',
  nameMn: '',
  logo: '',
  isActive: true,
};

export function AssociationFormSheet({
  open,
  onOpenChange,
  editId,
  onSaved,
}: AssociationFormSheetProps) {
  const isEdit = Boolean(editId);
  const [form, setForm] = useState(DEFAULT_FORM);
  const { uploadUrl } = useUploadConfig();

  const { data: editData, loading: editLoading } = useQuery(MTO_ASSOCIATION, {
    variables: { _id: editId ?? '' },
    skip: !editId || !open,
  });

  const [create, { loading: creating }] = useMutation(MTO_ASSOCIATION_CREATE);
  const [update, { loading: updating }] = useMutation(MTO_ASSOCIATION_UPDATE);

  const loading = creating || updating;

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
      return;
    }
    if (editId && editData?.mtoAssociation) {
      const a = editData.mtoAssociation;
      setForm({
        nameEn: a.name?.en ?? '',
        nameMn: a.name?.mn ?? '',
        logo: a.logo ?? '',
        isActive: a.isActive ?? true,
      });
    }
  }, [open, editId, editData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const variables = {
      name: { en: form.nameEn, mn: form.nameMn },
      logo: form.logo || undefined,
      isActive: form.isActive,
    };

    if (isEdit) {
      await update({ variables: { _id: editId!, ...variables } });
    } else {
      await create({ variables });
    }
    onSaved?.();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Sheet.View className="sm:max-w-lg">
        <Sheet.Header>
          <Sheet.Title>{isEdit ? 'Edit Association' : 'New Association'}</Sheet.Title>
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
                    setForm({ ...form, logo: typeof v.url === 'string' ? v.url : form.logo })
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
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
                <Label>Active</Label>
              </div>
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
