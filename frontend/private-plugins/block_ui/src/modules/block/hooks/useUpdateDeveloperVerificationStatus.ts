import { UPDATE_DEVELOPER_VERIFICATION_STATUS } from '@/block/graphql/blockMutations';
import { BLOCK_GET_DEVELOPER_INFO } from '@/block/graphql/blockQueries';
import { useMutation } from '@apollo/client';

export const useUpdateDeveloperVerificationStatus = () => {
  const [updateDeveloperVerificationStatus, { loading }] = useMutation(
    UPDATE_DEVELOPER_VERIFICATION_STATUS,
    { refetchQueries: [BLOCK_GET_DEVELOPER_INFO] },
  );

  return { updateDeveloperVerificationStatus, loading };
};
