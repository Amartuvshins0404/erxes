import { useQuery } from '@apollo/client';
import { GET_UNIT_PAYMENT_PLAN_DATA } from '@/unit/graphql/unitStatsQueries';
import { IContractPayment } from '@/contract-payment/types';
import { PaymentsRecordTable } from '@/contract-payment/components/PaymentsRecordTable';
import { PaymentTransactionsSheet } from '@/contract-payment/components/PaymentTransactionsSheet';

export const UnitPaymentScheduleTable = ({ unitId }: { unitId: string }) => {
  const { data, loading } = useQuery<{
    blockGetUnitPaymentPlanData: IContractPayment[];
  }>(GET_UNIT_PAYMENT_PLAN_DATA, {
    variables: { unitId },
    skip: !unitId,
  });

  const payments = data?.blockGetUnitPaymentPlanData ?? [];

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Payment History</p>
        <div className="h-[360px]">
          <PaymentsRecordTable
            payments={payments}
            loading={loading}
            tableId={`unit_payment_schedule_${unitId}`}
          />
        </div>
      </div>
      <PaymentTransactionsSheet />
    </>
  );
};
