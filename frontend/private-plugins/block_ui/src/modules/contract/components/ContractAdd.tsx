import { Button, Sheet, useQueryState, CurrencyCode, toast } from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useCreateContract } from '@/contract/hooks/useManageContract';
import { ContractFormData } from '@/contract/constants/contractSchema';
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
      <Sheet.View className="p-0 sm:max-w-5xl">
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
    const paymentPlan = data.paymentPlan?.type ? data.paymentPlan : undefined;
    const party =
      data.party && data.party.id
        ? { type: data.party.type, id: data.party.id }
        : undefined;
    const amount =
      typeof data.amount === 'number' && !isNaN(data.amount)
        ? Math.round(data.amount)
        : undefined;

    createContract({
      variables: {
        input: {
          unit: unitId || data.unit,
          number:
            data.number ||
            `${format(new Date(), 'yyMMddHHmmss').replace(/^0+/g, '')}`,
          currency: data.currency,
          date: data.date || new Date().toISOString(),
          amount,
          amountType: data.amountType,
          status: data.status || undefined,
          startDate: data.startDate,
          endDate: data.endDate,
          isLifeTime: data.isLifeTime,
          party,
          paymentPlan,
          user: data.user || undefined,
        },
      },
      refetchQueries: ['BlockGetContracts'],
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
    });
  };

  return (
    <ContractFormSheet
      defaultValues={{
        unit: unitId || '',
        party: { type: 'customer', id: '' },
        currency: CurrencyCode.MNT,
      }}
      onSubmit={handleSubmit}
      loading={loading}
      unitIdFromUrl={unitId}
    />
  );
};
