import { useMutation } from '@apollo/client';
import { MANUAL_SYNC_OFFER } from '../graphql/offerMutations';

export const useManualSyncOffer = () => {
  const [syncOffer, { loading }] = useMutation<{
    blockManualSyncOffer: { _id: string; status: string };
  }>(MANUAL_SYNC_OFFER);

  return { syncOffer, loading };
};
