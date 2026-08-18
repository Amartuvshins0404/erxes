import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { riskGroupFormSchema } from '../constants/riskGroupFormSchema';
import { z } from 'zod';
import {
  Button,
  DatePicker,
  Form,
  Input,
  ScrollArea,
  Sheet,
  Spinner,
} from 'erxes-ui';
import { SelectClient } from '@/clients/components/SelectClient';

export const RiskGroupForm = ({
  defaultValues,
  onSubmit,
  loading,
  isEdit = false,
}: {
  defaultValues: Partial<z.infer<typeof riskGroupFormSchema>>;
  onSubmit: (data: z.infer<typeof riskGroupFormSchema>) => void;
  loading?: boolean;
  isEdit?: boolean;
}) => {
  const form = useForm<z.infer<typeof riskGroupFormSchema>>({
    resolver: zodResolver(riskGroupFormSchema),
    defaultValues: {
      name: '',
      client: '',
      effective_date: '',
      expiration_date: '',
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col flex-auto overflow-hidden"
      >
        <Sheet.Content className="flex-auto overflow-hidden">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-2 gap-6 p-6">
              <Form.Field
                control={form.control}
                name="name"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Name</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="client"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Client</Form.Label>
                    <SelectClient.FormItem
                      value={field.value}
                      onValueChange={field.onChange}
                      mode="single"
                      placeholder="Select client"
                    />
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="effective_date"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Effective Date</Form.Label>
                    <DatePicker
                      placeholder="Select date"
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => {
                        const dateValue = Array.isArray(date) ? date[0] : date;
                        field.onChange(
                          dateValue ? dateValue.toISOString() : undefined,
                        );
                      }}
                    />
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="expiration_date"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Expiration Date</Form.Label>
                    <DatePicker
                      placeholder="Select date"
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => {
                        const dateValue = Array.isArray(date) ? date[0] : date;
                        field.onChange(
                          dateValue ? dateValue.toISOString() : undefined,
                        );
                      }}
                    />
                    <Form.Message />
                  </Form.Item>
                )}
              />
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

