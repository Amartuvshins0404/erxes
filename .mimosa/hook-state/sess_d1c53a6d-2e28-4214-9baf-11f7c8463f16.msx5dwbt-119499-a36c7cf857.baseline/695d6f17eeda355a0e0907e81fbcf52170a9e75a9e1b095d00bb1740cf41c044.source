import { useQuery } from '@apollo/client';
import { MUSHOP_ORDER_DETAIL } from '../graphql/orderDetail';
import { IOrder } from '../types';

export const useOrderDetail = (_id?: string | null) => {
  const { data, loading } = useQuery<{ mushopOrderDetail: IOrder }>(
    MUSHOP_ORDER_DETAIL,
    { variables: { _id }, skip: !_id },
  );

  return { order: data?.mushopOrderDetail ?? null, loading };
};
