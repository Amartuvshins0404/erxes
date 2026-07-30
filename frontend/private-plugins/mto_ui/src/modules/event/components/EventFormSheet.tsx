import { useMutation, useQuery } from '@apollo/client';
import {
  Button,
  Input,
  Label,
  Select,
  Sheet,
  Spinner,
  Switch,
  Textarea,
} from 'erxes-ui';
import { readImage } from 'erxes-ui/utils/core';
import { useEffect, useState } from 'react';
import {
  MTO_EVENT_CREATE,
  MTO_EVENT_UPDATE,
} from '@/event/graphql/eventMutations';
import { MTO_EVENT } from '@/event/graphql/eventQueries';
import { EventStatus } from '@/event/types/event';
import { useEventCategoryOptions } from '@/event/hooks/useEventCategoryOptions';
import { EventCategoryMultiSelect } from '@/event/components/EventCategoryMultiSelect';
import { MtoUpload } from '~/components/onefit-upload';
import { useUploadConfig } from '@/config/hooks/useUploadConfig';

interface EventFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string | null;
  onSaved?: () => void;
}

const DEFAULT_FORM = {
  titleEn: '',
  titleMn: '',
  descriptionEn: '',
  descriptionMn: '',
  image: '',
  startDate: '',
  endDate: '',
  location: '',
  categoryIds: [] as string[],
  status: 'draft' as EventStatus,
  isActive: true,
};

const toDatetimeLocal = (value?: string) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromDatetimeLocal = (value: string) => {
  if (!value) return undefined;

  return new Date(value).toISOString();
};

export function EventFormSheet({
  open,
  onOpenChange,
  editId,
  onSaved,
}: EventFormSheetProps) {
  const isEdit = Boolean(editId);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const { uploadUrl } = useUploadConfig();

  const { data: editData, loading: editLoading } = useQuery(MTO_EVENT, {
    variables: { _id: editId ?? '' },
    skip: !editId || !open,
  });

  const [create, { loading: creating }] = useMutation(MTO_EVENT_CREATE);
  const [update, { loading: updating }] = useMutation(MTO_EVENT_UPDATE);
  const {
    loading: categoriesLoading,
    mainCategories,
    getAssociationLabel,
  } = useEventCategoryOptions();

  const loading = creating || updating;

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
      setError(null);
      return;
    }

    if (editId && editData?.mtoEvent) {
      const event = editData.mtoEvent;

      setForm({
        titleEn: event.title?.en ?? '',
        titleMn: event.title?.mn ?? '',
        descriptionEn: event.description?.en ?? '',
        descriptionMn: event.description?.mn ?? '',
        image: event.image ?? '',
        startDate: toDatetimeLocal(event.startDate),
        endDate: toDatetimeLocal(event.endDate),
        location: event.location ?? '',
        categoryIds: (event.categoryIds ?? []).filter((id: string) =>
          mainCategories.some((category) => category._id === id),
        ),
        status: (event.status as EventStatus) ?? 'draft',
        isActive: event.isActive ?? true,
      });
    }
  }, [open, editId, editData, mainCategories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.titleEn.trim() || !form.titleMn.trim()) {
      setError('Title in both languages is required');
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError('Start and end dates are required');
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError('End date must be on or after start date');
      return;
    }

    if (!form.categoryIds.length) {
      setError('Select at least one category');
      return;
    }

    const variables = {
      title: { en: form.titleEn.trim(), mn: form.titleMn.trim() },
      description:
        form.descriptionEn || form.descriptionMn
          ? {
              en: form.descriptionEn || undefined,
              mn: form.descriptionMn || undefined,
            }
          : undefined,
      image: form.image || undefined,
      startDate: fromDatetimeLocal(form.startDate),
      endDate: fromDatetimeLocal(form.endDate),
      location: form.location.trim() || undefined,
      categoryIds: form.categoryIds,
      status: form.status,
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
      setError(err instanceof Error ? err.message : 'Failed to save event');
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Sheet.View className="sm:max-w-lg">
        <Sheet.Header>
          <Sheet.Title>{isEdit ? 'Edit Event' : 'New Event'}</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content className="overflow-y-auto flex-1">
          {editLoading || categoriesLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-2">
                <Label>Title (EN) *</Label>
                <Input
                  value={form.titleEn}
                  onChange={(e) =>
                    setForm({ ...form, titleEn: e.target.value })
                  }
                  placeholder="English title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Title (MN) *</Label>
                <Input
                  value={form.titleMn}
                  onChange={(e) =>
                    setForm({ ...form, titleMn: e.target.value })
                  }
                  placeholder="Монгол гарчиг"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description (EN)</Label>
                <Textarea
                  value={form.descriptionEn}
                  onChange={(e) =>
                    setForm({ ...form, descriptionEn: e.target.value })
                  }
                  placeholder="English description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (MN)</Label>
                <Textarea
                  value={form.descriptionMn}
                  onChange={(e) =>
                    setForm({ ...form, descriptionMn: e.target.value })
                  }
                  placeholder="Монгол тайлбар"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <MtoUpload.Root
                  value={form.image}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      image: typeof v.url === 'string' ? v.url : form.image,
                    })
                  }
                  uploadUrl={uploadUrl}
                >
                  <div className="flex items-center gap-3">
                    {form.image && (
                      <img
                        src={readImage(form.image)}
                        alt="Event preview"
                        className="h-16 w-24 rounded object-cover border"
                      />
                    )}
                    <div className="flex flex-col gap-1">
                      <MtoUpload.Button variant="outline" size="sm" type="button">
                        {form.image ? 'Change image' : 'Upload image'}
                      </MtoUpload.Button>
                      {form.image && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => setForm({ ...form, image: '' })}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </MtoUpload.Root>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start date *</Label>
                  <Input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End date *</Label>
                  <Input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="Event location"
                />
              </div>
              <EventCategoryMultiSelect
                label="Categories"
                options={mainCategories}
                selectedIds={form.categoryIds}
                getLabel={getAssociationLabel}
                placeholder="Select categories"
                onChange={(categoryIds) => setForm({ ...form, categoryIds })}
              />
              <div className="space-y-2">
                <Label>Publish status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as EventStatus })
                  }
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="draft">Draft</Select.Item>
                    <Select.Item value="published">Published</Select.Item>
                  </Select.Content>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
                <Label>Active</Label>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
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
