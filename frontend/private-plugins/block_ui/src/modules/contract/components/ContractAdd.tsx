import { Button, Sheet, useQueryState, CurrencyCode, toast } from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useCreateContract } from '@/contract/hooks/useManageContract';
import { ContractFormData } from '@/contract/constants/contractSchema';
import { buildContractInput } from '@/contract/utils/contractInput';
import { format } from 'date-fns';
import { ContractFormSheet } from './ContractFormSheet';

export const ContractAddSheet = ({
  size = 'default',
}: {
  size?: 'default' | 'sm';
} = {}) => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button size={size}>
          <IconPlus />
          Add contract
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 sm:max-w-7xl">
        <Sheet.Header>
          <Sheet.Title>New contract</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <ContractAddForm onClose={() => setOpen(false)} />
      </Sheet.View>
    </Sheet>
  );
};

export const ContractAddForm = ({ onClose }: { onClose: () => void }) => {
  const [unitId] = useQueryState<string>('unitId');
  const { createContract, loading } = useCreateContract();

  const handleSubmit = (data: ContractFormData) => {
    const unit = unitId || data.unit;

    if (!unit) {
      toast({
        title: 'Select a unit',
        description: 'A contract must be attached to a unit.',
        variant: 'destructive',
      });

      return;
    }

    const input = buildContractInput(data, unit);

    createContract(
      {
        ...input,
        // A new contract gets a generated number and today's date unless the
        // form supplied them; editing never regenerates either.
        number:
          input.number ||
          `${format(new Date(), 'yyMMddHHmmss').replace(/^0+/g, '')}`,
        date: input.date || new Date().toISOString(),
      },
      {
        onCompleted: () => {
          toast({
            title: 'Contract created successfully',
            variant: 'success',
          });
          onClose();
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  return (
    <ContractFormSheet
      defaultValues={{
        unit: unitId || '',
        customerId: '',
        currency: CurrencyCode.MNT,
      }}
      onSubmit={handleSubmit}
      loading={loading}
      unitIdFromUrl={unitId}
    />
  );
};
