import { useQuery } from '@apollo/client';
import { GET_PAYMENTS } from '../graphql/paymentQueries';

export interface IPaymentMethod {
  _id: string;
  name: string;
  kind: string;
  status?: string;
}

export const usePayments = () => {
  const { data, loading } = useQuery<{ payments: IPaymentMethod[] }>(
    GET_PAYMENTS,
    {
      variables: { status: 'active' },
    },
  );

  return { payments: data?.payments || [], loading };
};
