import { useQuery } from '@apollo/client';
import { Button, Checkbox } from 'erxes-ui';
import { useState, useEffect } from 'react';
import { PAYMENTS } from '../graphql/configQueries';
import { useSelectedPayments } from '../hooks/useSelectedPayments';
import { useUpdateSelectedPayments } from '../hooks/useConfigMutations';

interface Payment {
  _id: string;
  name: string;
  kind: string;
  status: string;
  config?: any;
  createdAt?: string;
}

export function PaymentSelection() {
  const { data: paymentsData, loading: paymentsLoading } = useQuery(PAYMENTS, {
    variables: { status: 'active' },
  });
  const { selectedPaymentIds, loading: selectedLoading } =
    useSelectedPayments();
  const { updateSelectedPayments, loading: updateLoading } =
    useUpdateSelectedPayments();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && !selectedLoading) {
      setSelectedIds([...selectedPaymentIds]);
      setIsInitialized(true);
    }
  }, [selectedPaymentIds, selectedLoading, isInitialized]);

  const payments: Payment[] = paymentsData?.payments || [];

  const handleTogglePayment = (paymentId: string) => {
    setSelectedIds((prev) =>
      prev.includes(paymentId)
        ? prev.filter((id) => id !== paymentId)
        : [...prev, paymentId],
    );
  };

  const handleSave = async () => {
    await updateSelectedPayments(selectedIds);
    setIsInitialized(false);
  };

  const isLoading = paymentsLoading || selectedLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-500">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">Select Payments</h2>
        <p className="text-sm text-gray-600 mb-4">
          Choose which payment methods should be available in the system.
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="text-sm text-gray-500">No payments available</div>
      ) : (
        <>
          <div className="border rounded-lg divide-y">
            {payments.map((payment) => (
              <div
                key={payment._id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={selectedIds.includes(payment._id)}
                    onCheckedChange={() => handleTogglePayment(payment._id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {payment.name}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {payment.kind}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {payment.status}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={updateLoading}
              variant="default"
            >
              {updateLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
