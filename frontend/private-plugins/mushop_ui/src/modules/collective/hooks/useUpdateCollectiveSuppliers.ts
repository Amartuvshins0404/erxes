import { useMutation } from '@apollo/client';
import { MUSHOP_UPDATE_COLLECTIVE_SUPPLIERS } from '../graphql/mutations';
import { MUSHOP_COLLECTIVE_DETAIL } from '../graphql/collectiveDetail';
import { MUSHOP_COLLECTIVES } from '../graphql/queries';

export const useUpdateCollectiveSuppliers = (collectiveId?: string | null) => {
  const [mutate, { loading }] = useMutation(
    MUSHOP_UPDATE_COLLECTIVE_SUPPLIERS,
    {
      refetchQueries: [
        ...(collectiveId
          ? [
              {
                query: MUSHOP_COLLECTIVE_DETAIL,
                variables: { _id: collectiveId },
              },
            ]
          : []),
        { query: MUSHOP_COLLECTIVES },
      ],
    },
  );

  return { updateSuppliers: mutate, loading };
};
