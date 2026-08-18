import { IconPlus } from '@tabler/icons-react';
import { Button, Sheet, toast } from 'erxes-ui';
import { z } from 'zod';
import { riskGroupFormSchema } from '../constants/riskGroupFormSchema';
import { RiskGroupForm } from './RiskGroupForms';
import { useRiskGroupsCreate } from '../hooks/useRiskGroupsCreate';
import { useState } from 'react';

export const RiskGroupCreateSheet = () => {
  const [open, setOpen] = useState(false);
  const { createRiskGroup, loading } = useRiskGroupsCreate();
  const onSubmit = (data: z.infer<typeof riskGroupFormSchema>) => {
    createRiskGroup({
      variables: {
        input: data,
      },
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Risk group created successfully',
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
          Create risk group
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 sm:max-w-5xl">
        <Sheet.Header>
          <Sheet.Title>Create risk group</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <RiskGroupForm defaultValues={{}} onSubmit={onSubmit} loading={loading} />
      </Sheet.View>
    </Sheet>
  );
};

