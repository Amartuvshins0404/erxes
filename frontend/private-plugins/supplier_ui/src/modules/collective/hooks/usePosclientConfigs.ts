import { useQuery } from '@apollo/client';
import { GET_POSCLIENT_CONFIGS } from '../graphql/posQueries';

export interface IPosclientConfig {
  _id: string;
  name?: string;
  token: string;
}

export const usePosclientConfigs = () => {
  const { data, loading, error, refetch } = useQuery(GET_POSCLIENT_CONFIGS, {
    fetchPolicy: 'cache-and-network',
  });

  return {
    configs: (data?.posclientConfigs || []) as IPosclientConfig[],
    loading,
    error,
    refetch,
  };
};
