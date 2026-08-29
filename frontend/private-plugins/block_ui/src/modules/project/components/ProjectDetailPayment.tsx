import { useParams } from 'react-router-dom';
import { ContractPaymentSettings } from '@/contract-payment/components/ContractPaymentSettings';

export const ProjectDetailPayment = () => {
  const { id } = useParams();

  if (!id) {
    return null;
  }

  return (
    <div className="p-8">
      <ContractPaymentSettings projectId={id} />
    </div>
  );
};
