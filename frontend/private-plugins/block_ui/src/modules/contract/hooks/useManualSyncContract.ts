import { useMutation } from '@apollo/client';
import { MANUAL_SYNC_CONTRACT } from '../graphql/contractMutations';

export const useManualSyncContract = () => {
  const [syncContract, { loading }] = useMutation<{
    blockManualSyncContract: { _id: string; status: string };
  }>(MANUAL_SYNC_CONTRACT);

  return { syncContract, loading };
};
