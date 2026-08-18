import { useQuery } from '@apollo/client';
import { useOneFitMode } from './useOneFitMode';
import { REACT_APP_API_URL } from 'erxes-ui/utils';
import { ONE_FIT_MASTER_URL } from '../graphql/onefitModeQueries';

export const useUploadConfig = () => {
  const { isSlaveMode } = useOneFitMode();
  const { data, loading } = useQuery(ONE_FIT_MASTER_URL, {
    fetchPolicy: 'cache-and-network',
  });

  const masterUrl = data?.oneFitMasterUrl as string | undefined;
  const getUploadUrl = (): string => {
    if (isSlaveMode) {
      // Use onefit_api upload route which will proxy to master
      return `${REACT_APP_API_URL}/pl:onefit/upload-file`;
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
