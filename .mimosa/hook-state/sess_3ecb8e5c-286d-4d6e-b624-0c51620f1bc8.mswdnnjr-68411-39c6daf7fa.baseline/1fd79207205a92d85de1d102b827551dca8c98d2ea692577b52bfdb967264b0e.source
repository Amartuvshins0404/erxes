import { useQuery } from '@apollo/client';
import { useMtoMode } from './useMtoMode';
import { REACT_APP_API_URL } from 'erxes-ui/utils';
import { ONE_FIT_MASTER_URL } from '../graphql/mtoModeQueries';

export const useUploadConfig = () => {
  const { isSlaveMode } = useMtoMode();
  const { data, loading } = useQuery(ONE_FIT_MASTER_URL, {
    fetchPolicy: 'cache-and-network',
  });

  const masterUrl = data?.mtoMasterUrl as string | undefined;
  const getUploadUrl = (): string => {
    if (isSlaveMode) {
      // Use mto_api upload route which will proxy to master
      return `${REACT_APP_API_URL}/pl:mto/upload-file`;
    }
    // Use default core-api upload route
    return `${REACT_APP_API_URL}/upload-file`;
  };

  return {
    uploadUrl: getUploadUrl(),
    isSlaveMode,
    masterUrl,
    loading,
  };
};
