import { Button, Sheet, Spinner, toast, CurrencyCode } from 'erxes-ui';
import { IconPencil } from '@tabler/icons-react';
import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { useContract } from '@/contract/hooks/useContracts';
import { useUpdateContract } from '@/contract/hooks/useManageContract';
import { useUnit } from '@/unit/hooks/useUnit';
import { ContractFormData } from '@/contract/constants/contractSchema';
import { contractDetailSheetState } from '@/contract/states/contractDetailSheetState';
import { ContractFormSheet } from './ContractFormSheet';

export const ContractEditSheet = () => {
  const [open, setOpen] = useState(false);
  const activeContractId = useAtomValue(contractDetailSheetState);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button>
          <IconPencil />
          Edit
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 sm:max-w-5xl">
        <Sheet.Header>
          <Sheet.Title>Edit contract</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        {open && activeContractId && (
          <ContractEditBody
            contractId={activeContractId}
            onClose={() => setOpen(false)}
          />
        )}
      </Sheet.View>
    </Sheet>
  );
};

const ContractEditBody = ({
  contractId,
  onClose,
}: {
  contractId: string;
  onClose: () => void;
}) => {
  const { contract, loading: loadingContract } = useContract(contractId);
  const { unit } = useUnit(contract?.unit);
  const { updateContract, loading: updateLoading } = useUpdateContract();

  if (loadingContract) return <Spinner />;
  if (!contract) return null;

  const orUndef = <T,>(v: T | null | undefined): T | undefined =>
    v == null ? undefined : v;

  const defaultValues: Partial<ContractFormData> = {
    unit: contract.unit,
    number: contract.number || '',
    currency: (contract.currency as CurrencyCode) || CurrencyCode.MNT,
    date: orUndef(contract.date),
    amount: orUndef(contract.amount),
    amountType: orUndef(contract.amountType),
    status: orUndef(contract.status),
    startDate: orUndef(contract.startDate),
    endDate: orUndef(contract.endDate),
    isLifeTime: contract.isLifeTime || false,
    user: orUndef(contract.user),
    party: contract.party
      ? {
          type: contract.party.type,
          id: contract.party.id,
        }
      : { type: 'customer', id: '' },
    paymentPlan: contract.paymentPlan
      ? {
          type: orUndef(contract.paymentPlan.type),
          downPaymentPercentage: orUndef(
            contract.paymentPlan.downPaymentPercentage,
          ),
          interestPercentage: orUndef(contract.paymentPlan.interestPercentage),
          interestType: orUndef(contract.paymentPlan.interestType),
          advancePaymentPercentage: orUndef(
            contract.paymentPlan.advancePaymentPercentage,
          ),
          discountPercentage: orUndef(
            contract.paymentPlan.discountPercentage,
          ),
          description: orUndef(contract.paymentPlan.description),
          installment: orUndef(contract.paymentPlan.installment),
          frequency: orUndef(contract.paymentPlan.frequency),
          penaltyPercentage: orUndef(contract.paymentPlan.penaltyPercentage),
          vatIncluded: contract.paymentPlan.vatIncluded || false,
          paymentDates: orUndef(contract.paymentPlan.paymentDates),
        }
      : undefined,
  };

  const handleSubmit = async (data: ContractFormData) => {
    const paymentPlan = data.paymentPlan?.type ? data.paymentPlan : undefined;
    const party =
      data.party && data.party.id
        ? { type: data.party.type, id: data.party.id }
        : undefined;
    const amount =
      typeof data.amount === 'number' && !isNaN(data.amount)
        ? Math.round(data.amount)
        : undefined;

    try {
      await updateContract(contractId, {
        unit: contract.unit,
        number: data.number,
        currency: data.currency,
        date: data.date,
        amount,
        amountType: data.amountType,
        status: data.status || undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        isLifeTime: data.isLifeTime,
        party,
        paymentPlan,
        user: data.user || undefined,
      });
      toast({
        title: 'Contract updated',
        variant: 'success',
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Update failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <ContractFormSheet
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      loading={updateLoading}
      isEdit
      hideUnitSection
      unit={unit}
      submitLabel="Update"
    />
  );
};
