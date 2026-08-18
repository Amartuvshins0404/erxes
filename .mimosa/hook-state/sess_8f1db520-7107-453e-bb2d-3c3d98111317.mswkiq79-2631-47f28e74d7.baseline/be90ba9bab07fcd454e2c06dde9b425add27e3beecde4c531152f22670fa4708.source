import { QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  mergeCursorData,
  parseDateRangeFromString,
  useMultiQueryState,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { ORDERS_CURSOR_SESSION_KEY } from '../constants/cursorSessionKey';
import { MUSHOP_ORDERS } from '../graphql/queries';
import { IOrderList } from '../types';

const ORDERS_PER_PAGE = 20;

export const useOrderVariables = (variables?: QueryHookOptions['variables']) => {
  const [{ status, supplierId, customerId, entityId, created }] =
    useMultiQueryState<{
      status: string;
      supplierId: string;
      customerId: string;
      entityId: string;
      created: string;
    }>(['status', 'supplierId', 'customerId', 'entityId', 'created']);

  const dateFilters: Record<string, any> = {};

  if (created) {
    dateFilters.createdAt = {
      gte: parseDateRangeFromString(created)?.from,
      lte: parseDateRangeFromString(created)?.to,
    };
  }

  return {
    ...(variables || {}),
    status: status || undefined,
    supplierId: supplierId || undefined,
    customerId: customerId || undefined,
    entityId: entityId || undefined,
    dateFilters: Object.keys(dateFilters)?.length
      ? JSON.stringify(dateFilters)
      : undefined,
  };
};

export const useOrders = (options?: QueryHookOptions) => {
  const variables = useOrderVariables(options?.variables);
  const { cursor } = useRecordTableCursor({
    sessionKey: ORDERS_CURSOR_SESSION_KEY,
  });

  const { data, loading, fetchMore } = useQuery<{ mushopOrders: IOrderList }>(
    MUSHOP_ORDERS,
    {
      ...options,
      variables: { ...variables, cursor, limit: ORDERS_PER_PAGE },
    },
  );

  const { list: orders, pageInfo, totalCount } = data?.mushopOrders || {};

  const handleFetchMore = ({
    direction = EnumCursorDirection.FORWARD,
  }: {
    direction?: EnumCursorDirection;
  } = {}) => {
    if (!validateFetchMore({ direction, pageInfo })) return;

    fetchMore({
      variables: {
        ...variables,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: ORDERS_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          mushopOrders: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.mushopOrders,
            prevResult: prev.mushopOrders,
          }),
        });
      },
    });
  };

  return { orders, loading, pageInfo, totalCount, handleFetchMore };
};
