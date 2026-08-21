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
  Textarea,
  toast,
} from 'erxes-ui';
import { readImage } from 'erxes-ui/utils/core';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { EventCategoryMultiSelect } from '@/event/components/EventCategoryMultiSelect';
import {
  EventFormData,
  eventFormSchema,
} from '@/event/constants/eventSchema';
import {
  MTO_EVENT_CREATE,
  MTO_EVENT_UPDATE,
} from '@/event/graphql/eventMutations';
import { MTO_EVENT } from '@/event/graphql/eventQueries';
import { useEventCategoryOptions } from '@/event/hooks/useEventCategoryOptions';
import { EventStatus } from '@/event/types/event';
import { useUploadConfig } from '@/config/hooks/useUploadConfig';
import { MtoUpload } from '~/components/MtoUpload';

interface EventFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string | null;
  onSaved?: () => void;
}

const DEFAULT_VALUES: EventFormData = {
  titleEn: '',
  titleMn: '',
  descriptionEn: '',
  descriptionMn: '',
  image: '',
  startDate: '',
  endDate: '',
  location: '',
  categoryIds: [],
  status: 'draft',
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
  const { uploadUrl } = useUploadConfig();
  const {
    loading: categoriesLoading,
    categories,
    getCategoryLabel,
  } = useEventCategoryOptions();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { data: editData, loading: editLoading } = useQuery(MTO_EVENT, {
    variables: { _id: editId ?? '' },
    skip: !editId || !open,
  });

  const [create, { loading: creating }] = useMutation(MTO_EVENT_CREATE);
  const [update, { loading: updating }] = useMutation(MTO_EVENT_UPDATE);
  const loading = creating || updating;

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (editId && editData?.mtoEvent) {
      const event = editData.mtoEvent;
      form.reset({
        titleEn: event.title?.en ?? '',
        titleMn: event.title?.mn ?? '',
        descriptionEn: event.description?.en ?? '',
        descriptionMn: event.description?.mn ?? '',
        image: event.image ?? '',
        startDate: toDatetimeLocal(event.startDate),
        endDate: toDatetimeLocal(event.endDate),
        location: event.location ?? '',
        categoryIds: (event.categoryIds ?? []).filter((id: string) =>
          categories.some((category) => category._id === id),
        ),
        status: (event.status as EventStatus) ?? 'draft',
        isActive: event.isActive ?? true,
      });
    }
  }, [open, editId, editData, categories, form]);

  const onSubmit = async (data: EventFormData) => {
    const variables = {
      title: { en: data.titleEn.trim(), mn: data.titleMn.trim() },
      description:
        data.descriptionEn || data.descriptionMn
          ? {
              en: data.descriptionEn || undefined,
              mn: data.descriptionMn || undefined,
            }
          : undefined,
      image: data.image || undefined,
      startDate: fromDatetimeLocal(data.startDate),
      endDate: fromDatetimeLocal(data.endDate),
      location: data.location?.trim() || undefined,
      categoryIds: data.categoryIds,
      status: data.status,
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
        description: isEdit ? 'Event updated' : 'Event created',
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save event',
        variant: 'destructive',
      });
    }
  };

  const image = form.watch('image');
  const categoryIds = form.watch('categoryIds');

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
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="p-5 space-y-4"
              >
                <Form.Field
                  control={form.control}
                  name="titleEn"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Title (EN) *</Form.Label>
                      <Form.Control>
                        <Input {...field} placeholder="English title" />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="titleMn"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Title (MN) *</Form.Label>
                      <Form.Control>
                        <Input {...field} placeholder="Монгол гарчиг" />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="descriptionEn"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Description (EN)</Form.Label>
                      <Form.Control>
                        <Textarea
                          {...field}
                          placeholder="English description"
                          rows={3}
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="descriptionMn"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Description (MN)</Form.Label>
                      <Form.Control>
                        <Textarea
                          {...field}
                          placeholder="Монгол тайлбар"
                          rows={3}
                        />
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
                          {image ? (
                            <img
                              src={readImage(image)}
                              alt="Event preview"
                              className="h-16 w-24 rounded object-cover border"
                            />
                          ) : null}
                          <div className="flex flex-col gap-1">
                            <MtoUpload.Button
                              variant="outline"
                              size="sm"
                              type="button"
                            >
                              {image ? 'Change image' : 'Upload image'}
                            </MtoUpload.Button>
                            {image ? (
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Start date *</Form.Label>
                        <Form.Control>
                          <Input type="datetime-local" {...field} />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>End date *</Form.Label>
                        <Form.Control>
                          <Input type="datetime-local" {...field} />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                </div>
                <Form.Field
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Location</Form.Label>
                      <Form.Control>
                        <Input {...field} placeholder="Event location" />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="categoryIds"
                  render={() => (
                    <Form.Item>
                      <EventCategoryMultiSelect
                        label="Categories"
                        options={categories}
                        selectedIds={categoryIds}
                        getLabel={getCategoryLabel}
                        placeholder="Select categories"
                        onChange={(ids) =>
                          form.setValue('categoryIds', ids, {
                            shouldValidate: true,
                          })
                        }
                      />
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Publish status</Form.Label>
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
                          <Select.Item value="draft">Draft</Select.Item>
                          <Select.Item value="published">Published</Select.Item>
                        </Select.Content>
                      </Select>
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
