import { useMutation } from '@apollo/client';
import { BLOCK_REMOVE_PROJECT } from '@/project/graphql/projectMutations';

export const useRemoveProject = () => {
  const [removeProject, { loading }] = useMutation(BLOCK_REMOVE_PROJECT);
  return { removeProject, loading };
};
