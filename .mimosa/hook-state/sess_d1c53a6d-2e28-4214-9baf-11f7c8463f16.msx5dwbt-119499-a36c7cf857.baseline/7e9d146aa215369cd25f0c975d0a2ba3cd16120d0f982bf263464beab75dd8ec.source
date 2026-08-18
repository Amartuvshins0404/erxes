import { useMutation } from '@apollo/client';
import { MUSHOP_RESYNC_ORDER } from '../graphql/mutations';
import { MUSHOP_ORDER_DETAIL } from '../graphql/orderDetail';
import { MUSHOP_ORDERS } from '../graphql/queries';

export const useResyncOrder = (orderId?: string | null) => {
  const [mutate, { loading }] = useMutation(MUSHOP_RESYNC_ORDER, {
    refetchQueries: [
      ...(orderId
        ? [{ query: MUSHOP_ORDER_DETAIL, variables: { _id: orderId } }]
        : []),
      { query: MUSHOP_ORDERS },
    ],
  });

  return { resyncOrder: mutate, loading };
};
