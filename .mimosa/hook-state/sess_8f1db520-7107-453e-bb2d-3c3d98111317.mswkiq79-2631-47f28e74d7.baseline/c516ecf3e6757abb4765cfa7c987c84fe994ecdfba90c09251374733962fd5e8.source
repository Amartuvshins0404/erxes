import { useQuery } from '@apollo/client';
import { MUSHOP_COLLECTIVE_DETAIL } from '../graphql/collectiveDetail';
import { ICollective } from '../types';

export const useCollectiveDetail = (_id?: string | null) => {
  const { data, loading } = useQuery<{ mushopCollectiveDetail: ICollective }>(
    MUSHOP_COLLECTIVE_DETAIL,
    { variables: { _id }, skip: !_id },
  );

  return { collective: data?.mushopCollectiveDetail ?? null, loading };
};
