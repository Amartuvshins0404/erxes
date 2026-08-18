import { IconPlus } from '@tabler/icons-react';
import { Button, Sheet, toast } from 'erxes-ui';
import { z } from 'zod';
import { clientFormSchema } from '../constants/clientFormSchema';
import { ClientForm } from './ClientForms';
import { useClientsCreate } from '../hooks/useClientsCreate';
import { useState } from 'react';

export const ClientCreateSheet = () => {
  const [open, setOpen] = useState(false);
  const { createClient, loading } = useClientsCreate();
  const onSubmit = (data: z.infer<typeof clientFormSchema>) => {
    createClient({
      variables: {
        input: data,
      },
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Client created successfully',
          variant: 'success',
        });
        setOpen(false);
      },
    });
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button>
          <IconPlus />
          Create client
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 sm:max-w-5xl">
        <Sheet.Header>
          <Sheet.Title>Create client</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <ClientForm defaultValues={{}} onSubmit={onSubmit} loading={loading} />
      </Sheet.View>
    </Sheet>
  );
};
