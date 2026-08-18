import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { UPDATE_PROJECT_GENERAL_INFO } from '../graphql/projectMutations';
import { IProjectGeneralInput } from '../types/projectTypes';

export const useUpdateProjectGeneralInfo = () => {
  const [updateProjectGeneralInfoMutation] = useMutation(
    UPDATE_PROJECT_GENERAL_INFO,
  );

  const updateProjectGeneralInfo = (
    id: string,
    input: Partial<IProjectGeneralInput>,
  ) => {
    updateProjectGeneralInfoMutation({
      variables: { id, input },
      update: (cache, { data: { blockUpdateProjectGeneralInfo } }) => {
        cache.modify({
          id: cache.identify(blockUpdateProjectGeneralInfo),
          fields: Object.keys(input).reduce(
            (fields: Record<string, () => any>, field) => {
              fields[field] = () => input[field as keyof IProjectGeneralInput];
              return fields;
            },
            {},
          ),
          optimistic: true,
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
