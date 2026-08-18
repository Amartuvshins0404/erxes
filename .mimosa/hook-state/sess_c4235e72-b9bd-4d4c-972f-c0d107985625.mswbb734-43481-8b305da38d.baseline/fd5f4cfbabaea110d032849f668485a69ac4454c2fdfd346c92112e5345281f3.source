import {
  IconArrowDown,
  IconArrowUp,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { Button, Form, Input, Label } from 'erxes-ui';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { TimeSelect } from '@/events/components/TimeSelect';
import { EventFormValues } from '@/events/components/eventFormSchema';

const NEW_ITEM = {
  startTime: '',
  endTime: '',
  title: '',
  description: '',
};

export const AgendaEditor = ({
  form,
}: {
  form: UseFormReturn<EventFormValues>;
}) => {
  const { fields, append, remove, swap } = useFieldArray({
    control: form.control,
    name: 'agenda',
  });

  const agendaError = form.formState.errors.agenda;
  const overlapMessage =
    agendaError && !Array.isArray(agendaError) ? agendaError.message : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label>Schedule</Label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append(NEW_ITEM)}
        >
          <IconPlus />
          Add item
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No agenda items yet. Add one to outline the schedule attendees see.
        </p>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border p-3">
          <div className="grid grid-cols-2 gap-3">
            <Form.Field
              control={form.control}
              name={`agenda.${index}.startTime`}
              render={({ field: timeField }) => (
                <Form.Item>
                  <Form.Label>Starts</Form.Label>
                  <TimeSelect
                    value={timeField.value}
                    onChange={timeField.onChange}
                    aria-label={`Agenda item ${index + 1} start time`}
                  />
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name={`agenda.${index}.endTime`}
              render={({ field: timeField }) => (
                <Form.Item>
                  <Form.Label>Ends</Form.Label>
                  <TimeSelect
                    value={timeField.value}
                    onChange={timeField.onChange}
                    aria-label={`Agenda item ${index + 1} end time`}
                  />
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name={`agenda.${index}.title`}
              render={({ field: titleField }) => (
                <Form.Item className="col-span-2">
                  <Form.Label>Title</Form.Label>
                  <Form.Control>
                    <Input placeholder="Бүртгэл, холбоо авах" {...titleField} />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
          </div>

          <div className="mt-3 flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move item up"
              disabled={index === 0}
              onClick={() => swap(index, index - 1)}
            >
              <IconArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move item down"
              disabled={index === fields.length - 1}
              onClick={() => swap(index, index + 1)}
            >
              <IconArrowDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove item"
              className="text-destructive"
              onClick={() => remove(index)}
            >
              <IconTrash />
            </Button>
          </div>
        </div>
      ))}

      {overlapMessage && (
        <p className="text-sm text-destructive">{overlapMessage}</p>
      )}
    </div>
  );
};
