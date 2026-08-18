import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { ONE_FIT_SYSTEM_CONFIG_BY_KEY } from '../graphql/configQueries';

export function useSelectedPayments() {
  const { data, loading, error } = useQuery(ONE_FIT_SYSTEM_CONFIG_BY_KEY, {
    variables: { key: 'selectedPayments' },
    fetchPolicy: 'cache-and-network',
  });

  const value = data?.oneFitSystemConfigByKey?.value;
  const valueString = useMemo(
    () => JSON.stringify(Array.isArray(value) ? [...value].sort() : []),
    [value],
  );

  const selectedPaymentIds: string[] = useMemo(() => {
    if (Array.isArray(value)) {
      return [...value];
    }
    return [];
  }, [valueString]);

  return {
    selectedPaymentIds,
    loading,
    error,
  };
}
