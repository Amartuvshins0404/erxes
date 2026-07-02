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
      <Sheet.View className="p-0 sm:max-w-7xl">
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
    status: orUndef(contract.status),
    user: orUndef(contract.user),
    party: contract.party
      ? {
          type: contract.party.type,
          id: contract.party.id,
        }
      : { type: 'customer', id: '' },
    paymentPlan: contract.paymentPlan
      ? {
          downPaymentPercentage: orUndef(
            contract.paymentPlan.downPaymentPercentage,
          ),
          downPaymentAmount: orUndef(contract.paymentPlan.downPaymentAmount),
          barterPercentage: orUndef(contract.paymentPlan.barterPercentage),
          barterAmount: orUndef(contract.paymentPlan.barterAmount),
          interestPercentage: orUndef(contract.paymentPlan.interestPercentage),
          interestType: orUndef(contract.paymentPlan.interestType),
          completionPaymentPercentage: orUndef(
            contract.paymentPlan.completionPaymentPercentage,
          ),
          completionPaymentAmount: orUndef(contract.paymentPlan.completionPaymentAmount),
          discountPercentage: orUndef(
            contract.paymentPlan.discountPercentage,
          ),
          description: orUndef(contract.paymentPlan.description),
          installment: orUndef(contract.paymentPlan.installment),
          frequency: orUndef(contract.paymentPlan.frequency),
          penaltyPercentage: orUndef(contract.paymentPlan.penaltyPercentage),
          vatIncluded: contract.paymentPlan.vatIncluded || false,
          roundedInstallmentAmount: orUndef(contract.paymentPlan.roundedInstallmentAmount),
          installmentAmounts: orUndef(contract.paymentPlan.installmentAmounts),
          paymentDates: orUndef(contract.paymentPlan.paymentDates),
          paymentDueDates: orUndef(contract.paymentPlan.paymentDueDates),
          firstPaymentDate: orUndef(contract.paymentPlan.firstPaymentDate),
          downPaymentDate: orUndef(contract.paymentPlan.downPaymentDate),
          completionPaymentDate: orUndef(contract.paymentPlan.completionPaymentDate),
        }
      : undefined,
  };

  const handleSubmit = async (data: ContractFormData) => {
    const paymentPlan = data.paymentPlan?.frequency ? data.paymentPlan : undefined;
    const party =
      data.party && data.party.id
        ? { type: data.party.type, id: data.party.id }
        : undefined;
    const amount =
      typeof data.amount === 'number' && !isNaN(data.amount)
        ? data.amount
        : undefined;

    try {
      await updateContract(contractId, {
        unit: contract.unit,
        number: data.number,
        currency: data.currency,
        date: data.date,
        amount,
        status: data.status || undefined,
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
