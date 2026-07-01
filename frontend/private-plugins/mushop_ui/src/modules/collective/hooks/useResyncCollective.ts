import { useMutation } from '@apollo/client';
import { MUSHOP_RESYNC_COLLECTIVE } from '../graphql/mutations';
import { MUSHOP_COLLECTIVE_DETAIL } from '../graphql/collectiveDetail';
import { MUSHOP_COLLECTIVES } from '../graphql/queries';

export const useResyncCollective = (collectiveId?: string | null) => {
  const [mutate, { loading }] = useMutation(MUSHOP_RESYNC_COLLECTIVE, {
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
  });

  return { resyncCollective: mutate, loading };
};
