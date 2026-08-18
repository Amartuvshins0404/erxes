import { useQuery } from '@apollo/client';
import { BLOCK_ADMIN_GET_DEVELOPER_INFO } from '../graphql/blockQueries';

export const useDeveloperInfo = (_id?: string) => {
  const { data, loading, error } = useQuery(BLOCK_ADMIN_GET_DEVELOPER_INFO, {
    variables: { _id },
    skip: !_id,
  });
  const { getBlockAdminDeveloperInfo: developerInfo } = data || {};
  return { loading, error, developerInfo };
};
