import { useQuery } from '@apollo/client';
import { BLOCK_GET_DEVELOPER_INFO } from '../graphql/blockQueries';

export const useDeveloperInfo = () => {
  const { data, loading, error } = useQuery(BLOCK_GET_DEVELOPER_INFO);
  const { getDeveloperInfo: developerInfo } = data || {};
  return { loading, error, developerInfo };
};
