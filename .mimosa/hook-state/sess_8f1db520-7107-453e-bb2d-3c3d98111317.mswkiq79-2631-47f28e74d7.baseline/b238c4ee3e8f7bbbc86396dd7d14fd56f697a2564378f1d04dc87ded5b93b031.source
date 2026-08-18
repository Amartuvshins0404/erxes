import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  DatePicker,
  Form,
  ScrollArea,
  Select,
  Separator,
  Sheet,
  Spinner,
  Textarea,
} from 'erxes-ui';
import { useFieldArray, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { SelectCustomer, SelectMember, currentUserState } from 'ui-modules';
import { useCreateOppty } from '@/oppty/hooks/useCreateOppty';
import { TAddOppty, addOpptySchema } from '@/oppty/types/validations';
import { OPPTY_CUSTOMER_SOURCES } from '@/oppty/constants/oppty';
import { useBlockStatusesByType } from '@/status/hooks/useGetBlockStatuses';
import { IconPlus } from '@tabler/icons-react';
import { UnitSelectRow } from './UnitSelectRow';
import { SelectTenureType } from '@/unit/components/SelectTenureType';
import { SelectUnitType } from '@/unit/components/SelectUnitType';

export const AddOpptyForm = ({ onClose }: { onClose: () => void }) => {
  const { projectId } = useParams<{ projectId?: string }>();
  const currentUser = useAtomValue(currentUserState);
  const { createOppty, loading } = useCreateOppty();
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
      assignedUserId: currentUser?._id || undefined,
      unitType: '',
      tenureType: '',
      unitRows: [{ buildingId: '', zoningId: '', unitId: '' }],
      labelIds: [],
      tagIds: [],
      projectId: projectId || undefined,
      startDate: undefined,
      targetDate: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'unitRows',
  });

  const onSubmit = (data: TAddOppty) => {
    const propertyRows = data.unitRows
      .filter((row) => row.buildingId)
      .map((row) => ({
        buildingId: row.buildingId,
        zoningId: row.zoningId || undefined,
        unitId: row.unitId || undefined,
        isMain: row.isMain || false,
      }));

    createOppty({
      variables: {
        input: {
          description: data.description,
          customerId: data.customerId,
          status: data.status,
          customerSource: data.customerSource,
          assignedUserId: data.assignedUserId,
          unitType: data.unitType || undefined,
          tenureType: data.tenureType || undefined,
          propertyRows,
          labelIds: data.labelIds,
          tagIds: data.tagIds,
          startDate: data.startDate,
          targetDate: data.targetDate,
          projectId: projectId || data.projectId,
        },
      },
      onCompleted: () => {
        onClose();
        form.reset();
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col flex-auto overflow-hidden"
      >
        <Sheet.Content className="flex-auto overflow-hidden">
          <ScrollArea className="h-full">
            <div className="gap-4 grid grid-cols-2 p-5">
              <div className="gap-4 grid blk:grid-cols-2 col-span-2">
                <div className="flex flex-col gap-3">
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
                              <Select.Item key={status._id} value={status._id}>
                                <span className="flex items-center gap-2">
                                  {status.color && (
                                    <span
                                      className="rounded-full size-2"
                                      style={{ backgroundColor: status.color }}
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
                          return { areaType: '', tenureTypes: [] as string[] };
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
                </div>

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
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </div>

              <Separator className="col-span-2" />

              <div className="col-span-2">
                <Form.Label className="block mb-3">Units</Form.Label>

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
              </div>

              <Separator className="col-span-2" />

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
          </ScrollArea>
        </Sheet.Content>
        <Sheet.Footer className="flex-none">
          <Sheet.Close asChild>
            <Button variant="secondary" className="bg-border">
              Cancel
            </Button>
          </Sheet.Close>
          <Button type="submit" disabled={loading}>
            <Spinner show={loading} />
            Save
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};
