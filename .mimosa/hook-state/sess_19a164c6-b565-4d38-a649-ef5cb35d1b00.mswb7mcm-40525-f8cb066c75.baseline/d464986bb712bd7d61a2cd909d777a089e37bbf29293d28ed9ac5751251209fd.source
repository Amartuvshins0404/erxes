import {
  Button,
  Dialog,
  Form,
  Input,
  Select,
  Spinner,
  Textarea,
} from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useCreateScheduleException } from '../hooks/useScheduleMutations';
import { createScheduleExceptionSchema } from '../schemas/scheduleSchemas';
import { SelectProviderSearchable } from '~/modules/provider/components/SelectProviderSearchable';

type CreateScheduleExceptionFormData = z.infer<
  typeof createScheduleExceptionSchema
>;

export const CreateScheduleExceptionDialog = () => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>
          <IconPlus />
          Create Schedule Exception
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Create Schedule Exception</Dialog.Title>
        </Dialog.Header>
        <CreateScheduleExceptionForm onClose={() => setOpen(false)} />
      </Dialog.Content>
    </Dialog>
  );
};

const CreateScheduleExceptionForm = ({ onClose }: { onClose: () => void }) => {
  const form = useForm<CreateScheduleExceptionFormData>({
    resolver: zodResolver(createScheduleExceptionSchema),
    defaultValues: {
      providerId: '',
      date: '',
      reason: '',
    },
  });
  const { createScheduleException, loading } = useCreateScheduleException();

  const onSubmit = (data: CreateScheduleExceptionFormData) => {
    createScheduleException({
      variables: {
        providerId: data.providerId,
        date: new Date(data.date),
        reason: data.reason || undefined,
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
        className="flex flex-col gap-6"
      >
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
          name="date"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Date *</Form.Label>
              <Form.Control>
                <Input {...field} type="date" placeholder="Select date" />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="reason"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Reason</Form.Label>
              <Form.Control>
                <Textarea
                  {...field}
                  placeholder="Enter reason (optional)"
                  rows={3}
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Dialog.Footer>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Spinner show={loading} />
            Create Schedule Exception
          </Button>
        </Dialog.Footer>
      </form>
    </Form>
  );
};
