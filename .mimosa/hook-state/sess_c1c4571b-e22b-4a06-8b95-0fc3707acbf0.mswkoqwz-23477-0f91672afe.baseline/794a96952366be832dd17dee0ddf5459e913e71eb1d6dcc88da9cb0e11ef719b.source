import { useMutation } from '@apollo/client';
import { UPDATE_DEVELOPER_INFO } from '@/block/graphql/blockMutations';
import { toast } from 'erxes-ui';

export const useUpdateDeveloperInfo = () => {
  const [updateDeveloperInfo, { loading }] = useMutation(UPDATE_DEVELOPER_INFO);

  const updateDeveloperInfoMutation = (
      _id: string,
      input: Partial<any>,
    ) => {
      updateDeveloperInfo({
        variables: { _id, input },
        update: (cache, { data: { blockAdminUpdateDeveloper } }) => {
          if (!blockAdminUpdateDeveloper) return;
  
          cache.modify({
            id: cache.identify(blockAdminUpdateDeveloper),
            fields: Object.keys(input).reduce((fields, field) => {
              fields[field] = () => input[field];
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

  return { updateDeveloperInfoMutation, loading };
};
