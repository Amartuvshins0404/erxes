import { useQuery } from '@apollo/client';
import { BLOCK_GET_UNIT_TYPE } from '../graphql/unitQueries';

export const useUnitType = (id?: string | null) => {
  const { data, loading } = useQuery(BLOCK_GET_UNIT_TYPE, {
    variables: { id },
    skip: !id,
  });
  return { unitType: data?.blockGetUnitType, loading };
};
