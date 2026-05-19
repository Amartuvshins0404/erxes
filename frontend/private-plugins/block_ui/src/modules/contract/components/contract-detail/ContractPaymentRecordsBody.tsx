import { IContract } from '@/contract/types/contractTypes';
import { useContractPayments } from '@/contract-payment/hooks/usePayments';
import { PaymentsRecordTable } from '@/contract-payment/components/PaymentsRecordTable';

export const ContractPaymentRecordsBody = ({
  contract,
}: {
  contract: IContract;
}) => {
  const { payments, loading, pageInfo, handleFetchMore } = useContractPayments(
    contract._id,
  );

  if (!loading && payments.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-sm">
        No payment records yet. They are generated automatically from the
        payment plan when the contract is saved.
      </div>
    );
  }

  return (
    <PaymentsRecordTable
      payments={payments}
      loading={loading}
      tableId={`contract_payments_${contract._id}`}
      pageInfo={pageInfo}
      handleFetchMore={handleFetchMore}
      cursorSessionKey={`contract_payments_${contract._id}`}
    />
  );
};

export default ContractPaymentRecordsBody;
