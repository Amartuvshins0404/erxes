import { useQuery } from '@apollo/client';
import { ONE_FIT_MODE } from '../graphql/onefitModeQueries';

export const useOneFitMode = () => {
  const { data, loading, error } = useQuery(ONE_FIT_MODE, {
    fetchPolicy: 'cache-and-network',
  });

  const mode = data?.oneFitMode as 'master' | 'slave' | undefined;
  // Default to slave mode on error or when mode is undefined (safer fallback)
  const isSlaveMode = mode === undefined || mode === 'slave' || Boolean(error);

  return {
    mode,
    isSlaveMode,
    loading,
    error,
  };
};
