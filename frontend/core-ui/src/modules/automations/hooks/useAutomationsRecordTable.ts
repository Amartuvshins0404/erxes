import { AUTOMATIONS_MAIN_LIST } from '@/automations/graphql/automationQueries';
import { IAutomation } from '@/automations/types';
import { OperationVariables } from '@apollo/client';
import { useCursorListQuery } from 'erxes-ui';
import { useAutomationRecordTableFilters } from './useAutomationRecordTableFilters';

export const useAutomationsRecordTable = (options?: {
  variables?: OperationVariables;
  skip?: boolean;
}) => {
  const filters = useAutomationRecordTableFilters();

  return useCursorListQuery<IAutomation>(AUTOMATIONS_MAIN_LIST, {
    field: 'automationsMain',
    skip: options?.skip,
    variables: { ...filters, ...options?.variables },
  });
};
