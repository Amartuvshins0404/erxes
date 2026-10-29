import { useCursorListQuery, useMultiQueryState } from 'erxes-ui';
import { BROADCAST_MESSAGES } from '../graphql/queries';
import { TBroadcastMessage } from '../types';

export const useBroadcastMessageVariables = () => {
  const [{ searchValue, brand, fromUser, trigger, status, methods }] =
    useMultiQueryState<{
      searchValue: string;
      brand: string;
      fromUser: string;
      trigger: string;
      status: string;
      methods: string;
    }>([
      'searchValue',
      'brand',
      'fromUser',
      'trigger',
      'status',
      'methods',
    ]);

  return {
    searchValue: searchValue || undefined,
    brandId: brand || undefined,
    fromUserId: fromUser || undefined,
    trigger: trigger || undefined,
    status: status || undefined,
    method: methods || undefined,
  };
};

export const useMessages = () => {
  const variables = useBroadcastMessageVariables();

  const { list, ...rest } = useCursorListQuery<TBroadcastMessage>(
    BROADCAST_MESSAGES,
    { field: 'engageMessages', variables },
  );

  return { messages: list, ...rest };
};
