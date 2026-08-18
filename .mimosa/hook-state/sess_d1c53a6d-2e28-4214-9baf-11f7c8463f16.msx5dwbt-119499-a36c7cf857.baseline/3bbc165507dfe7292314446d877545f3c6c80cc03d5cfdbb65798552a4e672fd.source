import { useQuery } from '@apollo/client';
import { ONE_FIT_SYSTEM_CONFIG_BY_KEY } from '../graphql/configQueries';

const INSTANCE_ID_KEY = 'instanceId';

function configValueToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return String(value);
}

export const useOneFitInstanceId = () => {
  const { data, loading, error } = useQuery(ONE_FIT_SYSTEM_CONFIG_BY_KEY, {
    variables: { key: INSTANCE_ID_KEY },
    fetchPolicy: 'cache-and-network',
  });

  const value = data?.oneFitSystemConfigByKey?.value;
  const instanceId = configValueToString(value);

  return {
    instanceId: instanceId || undefined,
    loading,
    error,
  };
};
