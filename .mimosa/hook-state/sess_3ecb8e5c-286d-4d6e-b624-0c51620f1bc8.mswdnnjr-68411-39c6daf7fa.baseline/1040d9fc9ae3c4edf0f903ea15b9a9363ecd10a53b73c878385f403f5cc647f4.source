import { IconFileInvoice } from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  PageContainer,
  PageSubHeader,
  useQueryState,
  useMultiQueryState,
} from 'erxes-ui';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useProjectPayments } from '@/contract-payment/hooks/usePayments';
import { PaymentsRecordTable } from '@/contract-payment/components/PaymentsRecordTable';
import {
  PaymentsFilter,
  PaymentFilterValue,
} from '@/contract-payment/components/PaymentsFilter';
import { IContractPayment } from '@/contract-payment/types';
import { contractDetailSheetState } from '@/contract/states/contractDetailSheetState';
import { PaymentTransactionsSheet } from '@/contract-payment/components/PaymentTransactionsSheet';

const ContractDetailSheet = lazy(() =>
  import('@/contract/components/ContractDetailSheet').then((m) => ({
    default: m.ContractDetailSheet,
  })),
);

const ContractDetailSheetMount = () => {
  const activeContractId = useAtomValue(contractDetailSheetState);
  const [hasOpened, setHasOpened] = useState(false);
  useEffect(() => {
    if (activeContractId) setHasOpened(true);
  }, [activeContractId]);
  if (!hasOpened) return null;
  return (
    <Suspense fallback={null}>
      <ContractDetailSheet />
    </Suspense>
  );
};

const summarize = (payments: IContractPayment[]) => {
  const now = Date.now();
  let paidCount = 0;
  let unpaidCount = 0;
  let overdueCount = 0;
  let totalPaid = 0;
  let totalDue = 0;

  for (const p of payments) {
    totalDue += p.amount || 0;
    totalPaid += p.paidAmount ?? 0;
    if (p.status === 'paid') {
      paidCount += 1;
    } else {
      unpaidCount += 1;
      const due = p.dueDate ? Number(new Date(p.dueDate)) : 0;
      if (due && due < now) overdueCount += 1;
    }
  }

  return { paidCount, unpaidCount, overdueCount, totalPaid, totalDue };
};

export const PaymentsPage = () => {
  const { projectId } = useParams();
  const [filter] = useQueryState<PaymentFilterValue>('payment_filter');
  const [queries] = useMultiQueryState<{
    payment_contractNumber: string;
    payment_customerId: string;
    payment_unitNumber: string;
  }>(['payment_contractNumber', 'payment_customerId', 'payment_unitNumber']);

  const paidArg =
    filter === 'paid'
      ? true
      : filter === 'unpaid' || filter === 'overdue'
      ? false
      : undefined;
  const { payments, loading, pageInfo, handleFetchMore, totalCount } =
    useProjectPayments(
      projectId,
      paidArg,
      queries?.payment_contractNumber || undefined,
      queries?.payment_customerId || undefined,
      queries?.payment_unitNumber || undefined,
    );

  if (!projectId) return null;

  const filtered =
    filter === 'overdue'
      ? payments.filter((p) => {
          if (p.status === 'paid') return false;
          const due = p.dueDate ? Number(new Date(p.dueDate)) : 0;
          return due && due < Date.now();
        })
      : payments;

  const stats = summarize(payments);

  const formatAmount = (val: number) =>
    new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: 'MNT',
      minimumFractionDigits: 0,
    }).format(val);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to={`/block/project/${projectId}/payments`}>
                    <IconFileInvoice />
                    Payments
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
        </PageHeader.Start>
        <PageHeader.End>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{totalCount} total</span>
            <span>•</span>
            <span>
              Paid: <strong>{formatAmount(stats.totalPaid)}</strong>
            </span>
            <span>/</span>
            <span>
              Total: <strong>{formatAmount(stats.totalDue)}</strong>
            </span>
          </div>
        </PageHeader.End>
      </PageHeader>
      <PageSubHeader>
        <PaymentsFilter />
      </PageSubHeader>
      <PaymentsRecordTable
        payments={filtered}
        loading={loading}
        showContract
        showCustomer
        showUnit
        tableId="project_payments_record_table"
        pageInfo={pageInfo}
        handleFetchMore={handleFetchMore}
        cursorSessionKey={`project_payments_${projectId}_${filter || 'all'}`}
      />
      <ContractDetailSheetMount />
      <PaymentTransactionsSheet />
    </PageContainer>
  );
};
