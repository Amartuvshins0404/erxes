import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { ONE_FIT_SYSTEM_CONFIG_BY_KEY } from '../graphql/configQueries';
import { ONE_FIT_SYSTEM_CONFIG_UPDATE } from '../graphql/configMutations';

const INSTANCE_ID_KEY = 'instanceId';

function configValueToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return String(value);
}

export function useInstanceIdConfig() {
  const { data, loading, error, refetch } = useQuery(
    ONE_FIT_SYSTEM_CONFIG_BY_KEY,
    {
      variables: { key: INSTANCE_ID_KEY },
      fetchPolicy: 'cache-and-network',
    },
  );

  const [updateConfig, { loading: updateLoading }] = useMutation(
    ONE_FIT_SYSTEM_CONFIG_UPDATE,
    {
      refetchQueries: [
        {
          query: ONE_FIT_SYSTEM_CONFIG_BY_KEY,
          variables: { key: INSTANCE_ID_KEY },
        },
      ],
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Instance ID saved',
        });
      },
      onError: (err) => {
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
      },
    },
  );

  const instanceId = data?.oneFitSystemConfigByKey?.value;
  const instanceIdStr = configValueToString(instanceId);

  const updateInstanceId = (value: string) => {
    return updateConfig({
      variables: { key: INSTANCE_ID_KEY, value: value.trim() },
    });
  };

  return {
    instanceId: instanceIdStr,
    loading,
    error,
    updateInstanceId,
    updateLoading,
    refetch,
  };
}
