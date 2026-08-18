import { useQuery } from '@apollo/client';
import { BLOCK_GET_UNIT, BLOCK_UNIT_ATTACHMENTS } from '../graphql/unitQueries';

export const useUnit = (id?: string | null) => {
  const { data, loading } = useQuery(BLOCK_GET_UNIT, {
    variables: { id },
    skip: !id,
  });
  return { unit: data?.blockGetUnit, loading };
};

export const useUnitAttachments = (id?: string | null) => {
  const { data, loading } = useQuery(BLOCK_UNIT_ATTACHMENTS, {
    variables: { itemType: 'unit', itemId: id },
    skip: !id,
  });
  return { attachments: data?.blockGetAttachments, loading };
};
