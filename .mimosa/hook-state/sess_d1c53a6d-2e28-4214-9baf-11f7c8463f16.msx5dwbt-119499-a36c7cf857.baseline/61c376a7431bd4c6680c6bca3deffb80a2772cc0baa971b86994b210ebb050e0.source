import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { UPDATE_PROJECT_GENERAL_INFO } from '../graphql/projectMutations';
import { IProjectGeneralInput } from '../types/projectTypes';

export const useUpdateProjectGeneralInfo = () => {
  const [updateProjectGeneralInfoMutation] = useMutation(
    UPDATE_PROJECT_GENERAL_INFO,
  );

  const updateProjectGeneralInfo = (
    _id: string,
    input: Partial<IProjectGeneralInput>,
  ) => {
    updateProjectGeneralInfoMutation({
      variables: { _id, input },
      update: (cache, { data: { blockAdminUpdateProject } }) => {
        if (!blockAdminUpdateProject) return;

        cache.modify({
          id: cache.identify(blockAdminUpdateProject),
          fields: Object.keys(input).reduce((fields, field) => {
            fields[field] = () => input[field as keyof IProjectGeneralInput];
            return fields;
          }, {} as Record<string, () => any>),
          optimistic: true,
        });
      },
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Project updated successfully',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { updateProjectGeneralInfo };
};
