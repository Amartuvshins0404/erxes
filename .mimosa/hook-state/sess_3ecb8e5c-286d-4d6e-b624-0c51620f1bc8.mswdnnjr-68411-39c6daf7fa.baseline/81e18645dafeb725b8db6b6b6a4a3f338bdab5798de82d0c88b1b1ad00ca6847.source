import { Button, Dialog, Form, Input, Select, Spinner } from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useForm, useFieldArray, useFormState } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useQuery } from '@apollo/client';
import {
  useCreateScheduleTemplate,
  useUpdateScheduleTemplate,
} from '../hooks/useScheduleMutations';
import {
  createScheduleTemplateSchema,
  editScheduleTemplateSchema,
  expandDailyScheduleRowsToApi,
  getDuplicateDayActivityPairs,
} from '../schemas/scheduleSchemas';
import { ONE_FIT_SCHEDULE_TEMPLATE } from '../graphql/scheduleQueries';
import { DailyScheduleFields } from './DailyScheduleFields';
import {
  MONTHS,
  getDefaultDailySchedule,
  getCurrentMonth,
  getCurrentYear,
  groupDailySchedulesToRows,
} from '../utils/scheduleUtils';
import { SelectProviderSearchable } from '~/modules/provider/components/SelectProviderSearchable';

type CreateScheduleTemplateFormData = z.infer<
  typeof createScheduleTemplateSchema
>;
type EditScheduleTemplateFormData = z.infer<typeof editScheduleTemplateSchema>;

interface ScheduleTemplateDialogProps {
  mode: 'create' | 'edit';
  templateId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  initialProviderId?: string;
  initialYear?: number;
  initialMonth?: number;
  initialActivityTypeId?: string;
}

export const ScheduleTemplateDialog = ({
  mode,
  templateId,
  open,
  onOpenChange,
  onClose,
  initialProviderId,
  initialYear,
  initialMonth,
  initialActivityTypeId,
}: ScheduleTemplateDialogProps) => {
  const isCreate = mode === 'create';
  const [internalOpen, setInternalOpen] = useState(false);

  const effectiveOpen = open !== undefined ? open : internalOpen;
  const effectiveOnOpenChange =
    onOpenChange || ((newOpen: boolean) => setInternalOpen(newOpen));

  if (isCreate) {
    return (
      <Dialog open={effectiveOpen} onOpenChange={effectiveOnOpenChange}>
        <Dialog.Trigger asChild>
          <Button>
            <IconPlus />
            Create Schedule Template
          </Button>
        </Dialog.Trigger>
        <Dialog.Content className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <Dialog.Header>
            <Dialog.Title>Create Schedule Template</Dialog.Title>
          </Dialog.Header>
          <ScheduleTemplateForm
            mode="create"
            initialProviderId={initialProviderId}
            initialYear={initialYear}
            initialMonth={initialMonth}
            initialActivityTypeId={initialActivityTypeId}
            onClose={() => {
              effectiveOnOpenChange(false);
              onClose?.();
            }}
          />
        </Dialog.Content>
      </Dialog>
    );
  }

  return (
    <Dialog open={effectiveOpen} onOpenChange={effectiveOnOpenChange}>
      <Dialog.Content className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <Dialog.Header>
          <Dialog.Title>Edit Schedule Template</Dialog.Title>
        </Dialog.Header>
        <ScheduleTemplateForm
          mode="edit"
          templateId={templateId!}
          onClose={() => {
            effectiveOnOpenChange(false);
            onClose?.();
          }}
        />
      </Dialog.Content>
    </Dialog>
  );
};

interface ScheduleTemplateFormProps {
  mode: 'create' | 'edit';
  templateId?: string;
  onClose: () => void;
  initialProviderId?: string;
  initialYear?: number;
  initialMonth?: number;
  initialActivityTypeId?: string;
}

const ScheduleTemplateForm = ({
  mode,
  templateId,
  onClose,
  initialProviderId,
  initialYear,
  initialMonth,
  initialActivityTypeId,
}: ScheduleTemplateFormProps) => {
  const isCreate = mode === 'create';

  const { data: templateData, loading: queryLoading } = useQuery(
    ONE_FIT_SCHEDULE_TEMPLATE,
    {
      variables: { _id: templateId },
      skip: isCreate || !templateId,
    },
  );

  const template = templateData?.oneFitScheduleTemplate;

  const form = useForm<
    CreateScheduleTemplateFormData | EditScheduleTemplateFormData
  >({
    resolver: zodResolver(
      isCreate ? createScheduleTemplateSchema : editScheduleTemplateSchema,
    ),
    defaultValues: isCreate
      ? {
          providerId: initialProviderId ?? '',
          month: initialMonth ?? getCurrentMonth(),
          year: initialYear ?? getCurrentYear(),
          dailySchedules: initialActivityTypeId
            ? [
                {
                  ...getDefaultDailySchedule(),
                  activityTypeId: initialActivityTypeId,
                },
              ]
            : [],
        }
      : {
          dailySchedules: [],
        },
  });

  const watchedProviderId = form.watch('providerId');
  const { errors } = useFormState({ control: form.control });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'dailySchedules',
  });

  useEffect(() => {
    if (!isCreate && template?.dailySchedules?.length) {
      replace(groupDailySchedulesToRows(template.dailySchedules));
    }
  }, [template, isCreate, replace]);

  useEffect(() => {
    if (isCreate && !watchedProviderId) {
      fields.forEach((_, index) => {
        form.setValue(`dailySchedules.${index}.activityTypeId`, '');
      });
    }
  }, [watchedProviderId, fields, form, isCreate]);

  const { createScheduleTemplate, loading: createLoading } =
    useCreateScheduleTemplate();
  const { updateScheduleTemplate, loading: updateLoading } =
    useUpdateScheduleTemplate();

  const loading = isCreate ? createLoading : updateLoading;

  const onSubmit = (
    data: CreateScheduleTemplateFormData | EditScheduleTemplateFormData,
  ) => {
    // const duplicates = getDuplicateDayActivityPairs(data.dailySchedules);
    // if (duplicates.length > 0) {
    //   const list = duplicates
    //     .map((p) => `${p.dayOfWeek} / ${p.activityTypeId}`)
    //     .join(', ');
    //   form.setError('dailySchedules', {
    //     type: 'manual',
    //     message: `Each combination of day and activity type must be unique. Duplicates: ${list}`,
    //   });
    //   return;
    // }
    form.clearErrors('dailySchedules');
    const dailySchedulesForApi = expandDailyScheduleRowsToApi(
      data.dailySchedules,
    );
    if (isCreate) {
      const createData = data as CreateScheduleTemplateFormData;
      createScheduleTemplate({
        variables: {
          providerId: createData.providerId,
          month: createData.month,
          year: createData.year,
          dailySchedules: dailySchedulesForApi,
        },
        onCompleted: () => {
          onClose();
          form.reset();
        },
      });
    } else {
      updateScheduleTemplate({
        variables: {
          _id: templateId!,
          dailySchedules: dailySchedulesForApi,
        },
        onCompleted: () => {
          onClose();
        },
      });
    }
  };

  const addDailySchedule = () => {
    append({
      ...getDefaultDailySchedule(),
      activityTypeId: '',
    });
  };

  if (!isCreate && queryLoading) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        {isCreate && (
          <div className="grid grid-cols-3 gap-4">
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
            <Form.Field
              control={form.control}
              name="month"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Month *</Form.Label>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) =>
                      field.onChange(parseInt(value, 10))
                    }
                  >
                    <Form.Control>
                      <Select.Trigger>
                        <Select.Value placeholder="Select month" />
                      </Select.Trigger>
                    </Form.Control>
                    <Select.Content>
                      {MONTHS.map((month) => (
                        <Select.Item
                          key={month.value}
                          value={month.value.toString()}
                        >
                          {month.label}
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
              name="year"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Year *</Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      type="number"
                      min="2000"
                      placeholder="Enter year"
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value, 10) : 2000,
                        )
                      }
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Daily Schedules</h3>
          <Button type="button" variant="outline" onClick={addDailySchedule}>
            <IconPlus />
            Add Schedule
          </Button>
        </div>

        {(errors.dailySchedules?.message || errors.root?.message) && (
          <div
            className="text-sm text-destructive rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2"
            role="alert"
          >
            {errors.dailySchedules?.message ?? errors.root?.message}
          </div>
        )}

        {fields.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No daily schedules added. Click "Add Schedule" to add one.
          </div>
        )}

        <div className="flex flex-col gap-4">
          {fields.map((field, index) => (
            <DailyScheduleFields
              key={field.id}
              index={index}
              control={form.control}
              onRemove={() => remove(index)}
              providerId={isCreate ? watchedProviderId : template?.providerId}
              showActivityTypeSelect={true}
            />
          ))}
        </div>

        <Dialog.Footer>
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
          <Button type="submit" disabled={loading}>
            <Spinner show={loading} />
            {isCreate ? 'Create Schedule Template' : 'Update Schedule Template'}
          </Button>
        </Dialog.Footer>
      </form>
    </Form>
  );
};

// Export convenience components for backward compatibility
export const CreateScheduleTemplateDialog = () => {
  const [open, setOpen] = useState(false);
  return (
    <ScheduleTemplateDialog
      mode="create"
      open={open}
      onOpenChange={setOpen}
      onClose={() => setOpen(false)}
    />
  );
};

export const EditScheduleTemplateDialog = ({
  templateId,
  open,
  onOpenChange,
  onClose,
}: {
  templateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}) => (
  <ScheduleTemplateDialog
    mode="edit"
    templateId={templateId}
    open={open}
    onOpenChange={onOpenChange}
    onClose={onClose}
  />
);
