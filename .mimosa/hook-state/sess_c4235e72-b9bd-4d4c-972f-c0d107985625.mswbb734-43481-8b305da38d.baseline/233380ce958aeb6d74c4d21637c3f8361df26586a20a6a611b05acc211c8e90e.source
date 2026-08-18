import { useMutation } from '@apollo/client';
import { CREATE_PROJECT } from '../graphql/projectMutations';

export const useCreateProject = () => {
  const [createProject, { loading }] = useMutation(CREATE_PROJECT, {
    refetchQueries: ['BlockGetProjects'],
  });

  return {
    createProject: createProject,
    loading,
  };
};
