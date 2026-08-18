import { IconPlus } from '@tabler/icons-react';
import { Button, Sheet, toast } from 'erxes-ui';
import { z } from 'zod';
import { marketFormSchema } from '../constants/marketFormSchema';
import { MarketForm } from './MarketForms';
import { useMarketsCreate } from '../hooks/useMarketsCreate';
import { useState } from 'react';

export const MarketCreateSheet = () => {
  const [open, setOpen] = useState(false);
  const { createMarket, loading } = useMarketsCreate();
  const onSubmit = (data: z.infer<typeof marketFormSchema>) => {
    createMarket({
      variables: {
        input: data,
      },
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Market created successfully',
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
          Create market
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 sm:max-w-5xl">
        <Sheet.Header>
          <Sheet.Title>Create market</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <MarketForm defaultValues={{}} onSubmit={onSubmit} loading={loading} />
      </Sheet.View>
    </Sheet>
  );
};

