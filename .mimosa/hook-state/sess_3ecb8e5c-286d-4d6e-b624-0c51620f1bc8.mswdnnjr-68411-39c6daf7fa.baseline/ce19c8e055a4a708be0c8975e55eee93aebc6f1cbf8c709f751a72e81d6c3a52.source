import { Button, Dialog, Form, Input, Spinner, toast } from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useCreateNews } from '../hooks/useCreateNews';

export const CreateNews = () => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>
          <IconPlus />
          Create News
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Create News</Dialog.Title>
        </Dialog.Header>
        <CreateNewsForm onClose={() => setOpen(false)} />
      </Dialog.Content>
    </Dialog>
  );
};

const CreateNewsForm = ({ onClose }: { onClose: () => void }) => {
  const form = useForm<{ name: string }>({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, { message: 'Name is required' }),
      }),
    ),
    defaultValues: {
      name: '',
    },
  });
  const { createNews, loading } = useCreateNews();

  const onSubmit = (data: { name: string }) => {
    createNews({
      variables: {
        name: data.name,
      },
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'News created successfully',
        });
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
        <Dialog.Footer>
          <Button type="submit" size="lg" disabled={loading}>
            <Spinner show={loading} />
            Create news
          </Button>
        </Dialog.Footer>
      </form>
    </Form>
  );
};
