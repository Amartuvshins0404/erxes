import { useMutation, useQuery } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Input, Sheet, Spinner, Textarea, toast } from 'erxes-ui';
import { readImage } from 'erxes-ui/utils/core';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  TravelAssociationFormData,
  travelAssociationFormSchema,
} from '@/travelAssociation/constants/travelAssociationSchema';
import {
  MTO_TRAVEL_ASSOCIATION_CREATE,
  MTO_TRAVEL_ASSOCIATION_UPDATE,
} from '@/travelAssociation/graphql/travelAssociationMutations';
import { MTO_TRAVEL_ASSOCIATION } from '@/travelAssociation/graphql/travelAssociationQueries';
import { useUploadConfig } from '@/config/hooks/useUploadConfig';
import { MtoUpload } from '~/components/MtoUpload';

interface TravelAssociationFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string | null;
  onSaved?: () => void;
}

const DEFAULT_VALUES: TravelAssociationFormData = {
  titleEn: '',
  titleMn: '',
  descriptionEn: '',
  descriptionMn: '',
  logo: '',
  cover: '',
  foundDate: '',
};

const toDateInput = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const fromDateInput = (value: string) => {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`).toISOString();
};

export function TravelAssociationFormSheet({
  open,
  onOpenChange,
  editId,
  onSaved,
}: TravelAssociationFormSheetProps) {
  const isEdit = Boolean(editId);
  const { uploadUrl } = useUploadConfig();

  const form = useForm<TravelAssociationFormData>({
    resolver: zodResolver(travelAssociationFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { data: editData, loading: editLoading } = useQuery(
    MTO_TRAVEL_ASSOCIATION,
    {
      variables: { _id: editId ?? '' },
      skip: !editId || !open,
    },
  );

  const [create, { loading: creating }] = useMutation(
    MTO_TRAVEL_ASSOCIATION_CREATE,
  );
  const [update, { loading: updating }] = useMutation(
    MTO_TRAVEL_ASSOCIATION_UPDATE,
  );
  const loading = creating || updating;

  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
      return;
    }

    if (editId && editData?.mtoTravelAssociation) {
      const association = editData.mtoTravelAssociation;
      form.reset({
        titleEn: association.title?.en ?? '',
        titleMn: association.title?.mn ?? '',
        descriptionEn: association.description?.en ?? '',
        descriptionMn: association.description?.mn ?? '',
        logo: association.logo ?? '',
        cover: association.cover ?? '',
        foundDate: toDateInput(association.foundDate),
      });
    }
  }, [open, editId, editData, form]);

  const onSubmit = async (data: TravelAssociationFormData) => {
    const variables = {
      title: { en: data.titleEn.trim(), mn: data.titleMn.trim() },
      description:
        data.descriptionEn || data.descriptionMn
          ? {
              en: data.descriptionEn || undefined,
              mn: data.descriptionMn || undefined,
            }
          : undefined,
      logo: data.logo || '',
      cover: data.cover || '',
      foundDate: fromDateInput(data.foundDate),
    };

    try {
      if (isEdit && editId) {
        await update({ variables: { _id: editId, ...variables } });
      } else {
        await create({ variables });
      }

      toast({
        title: 'Success',
        description: isEdit
          ? 'Travel association updated'
          : 'Travel association created',
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error
            ? err.message
            : 'Failed to save travel association',
        variant: 'destructive',
      });
    }
  };

  const logo = form.watch('logo');
  const cover = form.watch('cover');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Sheet.View className="sm:max-w-lg">
        <Sheet.Header>
          <Sheet.Title>
            {isEdit ? 'Edit Travel Association' : 'New Travel Association'}
          </Sheet.Title>
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
                  name="cover"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Cover</Form.Label>
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
                          {cover ? (
                            <img
                              src={readImage(cover)}
                              alt="Cover preview"
                              className="h-16 w-24 rounded object-cover border"
                            />
                          ) : null}
                          <div className="flex flex-col gap-1">
                            <MtoUpload.Button
                              variant="outline"
                              size="sm"
                              type="button"
                            >
                              {cover ? 'Change cover' : 'Upload cover'}
                            </MtoUpload.Button>
                            {cover ? (
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
                  name="foundDate"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Found date *</Form.Label>
                      <Form.Control>
                        <Input type="date" {...field} />
                      </Form.Control>
                      <Form.Message />
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
