import { AUTOMATION_HISTORIES_CURSOR_SESSION_KEY } from '@/automations/constants';
import { AUTOMATION_HISTORIES } from '@/automations/graphql/automationQueries';
import { StatusBadgeValue } from '@/automations/types';
import {
  parseDateRangeFromString,
  useCursorListQuery,
  useMultiQueryState,
  useRecordTableCursor,
} from 'erxes-ui';
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { IAutomationHistory } from 'ui-modules';

const LOGS_PER_PAGE = 20;

export const useAutomationHistories = (automationId?: string) => {
  const { id: routeId } = useParams();
  const id = automationId ?? routeId;
  const [queries] = useMultiQueryState<{
    status?: StatusBadgeValue;
    createdAt: string;
    failedActionId?: string;
    errorCode?: string;
    waitingActionId?: string;
  }>(['status', 'createdAt', 'failedActionId', 'errorCode', 'waitingActionId']);
  const { setCursor } = useRecordTableCursor({
    sessionKey: AUTOMATION_HISTORIES_CURSOR_SESSION_KEY,
  });

  const filterKey = [
    id,
    queries.status,
    queries.createdAt,
    queries.failedActionId,
    queries.errorCode,
    queries.waitingActionId,
  ].join('|');
  const previousFilterKey = useRef(filterKey);

  useEffect(() => {
    if (previousFilterKey.current === filterKey) {
      return;
    }

    previousFilterKey.current = filterKey;
    sessionStorage.removeItem(AUTOMATION_HISTORIES_CURSOR_SESSION_KEY);
    sessionStorage.removeItem(
      `${AUTOMATION_HISTORIES_CURSOR_SESSION_KEY}_scroll`,
    );
    setCursor('');
  }, [filterKey, setCursor]);

  const createdAt = parseDateRangeFromString(queries.createdAt);

  const {
    list,
    totalCount,
    loading,
    error,
    hasPreviousPage,
    hasNextPage,
    handleFetchMore,
    refetch,
  } = useCursorListQuery<IAutomationHistory>(AUTOMATION_HISTORIES, {
    field: 'automationHistories',
    sessionKey: AUTOMATION_HISTORIES_CURSOR_SESSION_KEY,
    limit: LOGS_PER_PAGE,
    variables: {
      automationId: id,
      beginDate: createdAt?.from,
      endDate: createdAt?.to,
      status: queries.status,
      failedActionIds: queries.failedActionId
        ? [queries.failedActionId]
        : undefined,
      errorCodes: queries.errorCode ? [queries.errorCode] : undefined,
      waitingActionIds: queries.waitingActionId
        ? [queries.waitingActionId]
        : undefined,
    },
  });

  return {
    list,
    totalCount,
    loading,
    error,
    hasPreviousPage,
    hasNextPage,
    handleFetchMore,
    refetch,
  };
};
