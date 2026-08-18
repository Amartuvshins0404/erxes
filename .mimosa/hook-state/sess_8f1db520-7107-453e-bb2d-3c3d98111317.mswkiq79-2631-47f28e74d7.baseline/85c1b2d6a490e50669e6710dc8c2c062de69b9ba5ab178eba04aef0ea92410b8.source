import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addOpptySchema, TAddOppty } from '@/oppty/types/validations';
import { OPPTY_CUSTOMER_SOURCES } from '@/oppty/constants/oppty';
import { useBlockStatusesByType } from '@/status/hooks/useGetBlockStatuses';
import {
  Button,
  DatePicker,
  Form,
  InfoCard,
  ScrollArea,
  Select,
  Sheet,
  Spinner,
  Textarea,
} from 'erxes-ui';
import { SelectCustomer, SelectMember } from 'ui-modules';
import { IconPlus } from '@tabler/icons-react';
import { UnitSelectRow } from './UnitSelectRow';
import { useParams } from 'react-router-dom';
import { SelectTenureType } from '@/unit/components/SelectTenureType';
import { SelectUnitType } from '@/unit/components/SelectUnitType';

export const OpptyForm = ({
  defaultValues,
  onSubmit,
  loading,
  isEdit = false,
}: {
  defaultValues: Partial<TAddOppty>;
  onSubmit: (data: TAddOppty) => void;
  loading?: boolean;
  isEdit?: boolean;
}) => {
  const { projectId } = useParams<{ projectId?: string }>();

  const { statuses } = useBlockStatusesByType({
    projectId: projectId || '',
  });

  const form = useForm<TAddOppty>({
    resolver: zodResolver(addOpptySchema),
    defaultValues: {
      description: '',
      customerId: '',
      status: '',
      customerSource: '',
      assignedUserId: undefined,
      unitType: '',
      tenureType: '',
      unitRows: [{ buildingId: '', zoningId: '', unitId: '' }],
      labelIds: [],
      tagIds: [],
      projectId: projectId || undefined,
      startDate: undefined,
      targetDate: undefined,
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'unitRows',
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col flex-auto overflow-hidden"
      >
        <Sheet.Content className="flex-auto overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4 p-5">
              <InfoCard title="Basic Information">
                <InfoCard.Content>
                  <div className="gap-4 grid grid-cols-2">
                    <Form.Field
                      name="customerId"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Customer</Form.Label>
                          <SelectCustomer.FormItem
                            value={field.value}
                            onValueChange={field.onChange}
                            mode="single"
                          />
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="customerSource"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Customer Source</Form.Label>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <Form.Control>
                              <Select.Trigger className="h-8">
                                <Select.Value placeholder="Select source" />
                              </Select.Trigger>
                            </Form.Control>
                            <Select.Content>
                              {Object.entries(OPPTY_CUSTOMER_SOURCES).map(
                                ([key, value]) => (
                                  <Select.Item key={value} value={value}>
                                    {key
                                      .replace(/_/g, ' ')
                                      .toLowerCase()
                                      .replace(/^\w/, (c) => c.toUpperCase())}
                                  </Select.Item>
                                ),
                              )}
                            </Select.Content>
                          </Select>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="status"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Status</Form.Label>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <Form.Control>
                              <Select.Trigger className="h-8">
                                <Select.Value placeholder="Select status" />
                              </Select.Trigger>
                            </Form.Control>
                            <Select.Content>
                              {(statuses || []).map((status) => (
                                <Select.Item
                                  key={status._id}
                                  value={status._id}
                                >
                                  <span className="flex items-center gap-2">
                                    {status.color && (
                                      <span
                                        className="rounded-full size-2"
                                        style={{
                                          backgroundColor: status.color,
                                        }}
                                      />
                                    )}
                                    {status.name}
                                  </span>
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="assignedUserId"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Assigned to</Form.Label>
                          <SelectMember.FormItem
                            value={field.value || ''}
                            onValueChange={field.onChange}
                            mode="single"
                          />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="unitType"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Unit Type</Form.Label>
                          <SelectUnitType
                            inForm
                            value={field.value || ''}
                            onValueChange={field.onChange}
                          />
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="tenureType"
                      control={form.control}
                      render={({ field }) => {
                        const parseTenure = (val: string) => {
                          if (!val)
                            return {
                              areaType: '',
                              tenureTypes: [] as string[],
                            };
                          const [areaType, ...tenureTypes] = val.split(':');
                          return { areaType, tenureTypes };
                        };
                        const { areaType, tenureTypes } = parseTenure(
                          field.value || '',
                        );
                        return (
                          <Form.Item>
                            <Form.Label>Tenure Type</Form.Label>
                            <SelectTenureType
                              inForm
                              value={{ areaType, tenureTypes }}
                              onValueChange={(a, t) => {
                                if (!a) {
                                  field.onChange('');
                                  return;
                                }
                                field.onChange(
                                  t.length ? [a, ...t].join(':') : a,
                                );
                              }}
                            />
                            <Form.Message />
                          </Form.Item>
                        );
                      }}
                    />

                    <Form.Field
                      name="description"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item className="col-span-2">
                          <Form.Label>Description</Form.Label>
                          <Form.Control>
                            <Textarea
                              {...field}
                              placeholder="Opportunity description"
                              className="min-h-20"
                              rows={5}
                            />
                          </Form.Control>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />
                  </div>
                </InfoCard.Content>
              </InfoCard>

              <InfoCard title="Units">
                <InfoCard.Content>
                  <div className="flex flex-col gap-2">
                    {fields.map((field, index) => (
                      <UnitSelectRow
                        key={field.id}
                        index={index}
                        control={form.control}
                        projectId={projectId || ''}
                        onRemove={() => remove(index)}
                        setValue={form.setValue}
                        allUnitRows={form.watch('unitRows')}
                      />
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() =>
                      append({ buildingId: '', zoningId: '', unitId: '' })
                    }
                  >
                    <IconPlus className="size-4" />
                    Add unit
                  </Button>
                </InfoCard.Content>
              </InfoCard>

              <InfoCard title="Schedule">
                <InfoCard.Content>
                  <div className="gap-4 grid grid-cols-2">
                    <Form.Field
                      name="startDate"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Start Date</Form.Label>
                          <DatePicker
                            placeholder="Start date"
                            value={field.value}
                            onChange={(date) => field.onChange(date as Date)}
                          />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="targetDate"
                      control={form.control}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Target Date</Form.Label>
                          <DatePicker
                            placeholder="Target date"
                            value={field.value}
                            onChange={(date) => field.onChange(date as Date)}
                          />
                        </Form.Item>
                      )}
                    />
                  </div>
                </InfoCard.Content>
              </InfoCard>
            </div>
          </ScrollArea>
        </Sheet.Content>
        <Sheet.Footer className="flex-none">
          <Button type="submit" disabled={loading}>
            {loading && <Spinner containerClassName="flex-none" />}
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};
