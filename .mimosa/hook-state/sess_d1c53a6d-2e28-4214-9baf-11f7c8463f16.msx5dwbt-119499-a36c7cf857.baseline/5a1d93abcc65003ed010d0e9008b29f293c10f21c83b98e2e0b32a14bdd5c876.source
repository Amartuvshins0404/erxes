import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Dialog, Form, Input, Select, Spinner, toast } from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateListing } from '../hooks/useCreateListing';

const schema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  type: z.enum(['sale', 'rent', 'lease']),
});

type FormValues = z.infer<typeof schema>;

export const CreateListing = () => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>
          <IconPlus />
          Add Listing
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Create Listing</Dialog.Title>
        </Dialog.Header>
        <CreateListingForm onClose={() => setOpen(false)} />
      </Dialog.Content>
    </Dialog>
  );
};

const CreateListingForm = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const { createListing, loading } = useCreateListing();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', type: 'sale' },
  });

  const onSubmit = (data: FormValues) => {
    createListing({
      variables: {
        input: { title: data.title, type: data.type, status: 'draft' },
      },
      onCompleted: (result: any) => {
        const newId = result?.blockCreateListing?._id;
        onClose();
        form.reset();
        if (newId) navigate(newId);
      },
      onError: (error: any) => {
        toast({
          variant: 'destructive',
          title: 'Failed to create listing',
          description: error.message,
        });
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
          name="title"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Title</Form.Label>
              <Form.Control>
                <Input {...field} autoFocus />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="type"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Type</Form.Label>
              <Form.Control>
                <Select value={field.value} onValueChange={field.onChange}>
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="sale">Sale</Select.Item>
                    <Select.Item value="rent">Rent</Select.Item>
                    <Select.Item value="lease">Lease</Select.Item>
                  </Select.Content>
                </Select>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Dialog.Footer>
          <Button type="submit" size="lg" disabled={loading}>
            <Spinner show={loading} />
            Create Listing
          </Button>
        </Dialog.Footer>
      </form>
    </Form>
  );
};
