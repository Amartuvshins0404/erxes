import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { BLOCK_PUBLISH_PROJECT } from '../graphql/projectMutations';

export const usePublishProject = () => {
  const [updateProjectGeneralInfoMutation] = useMutation(BLOCK_PUBLISH_PROJECT);

  const publishProject = (id: string, isPublished: boolean) => {
    updateProjectGeneralInfoMutation({
      variables: { id, isPublished },
      update: (cache, { data: { blockUpdateProjectGeneralInfo } }) => {
        cache.modify({
          id: cache.identify(blockUpdateProjectGeneralInfo),
          fields: {
            isPublished: () => isPublished,
          },
          optimistic: true,
        });
      },
      onCompleted: () => {
        toast({
          title: 'Success',
          description:
            'Project ' +
            (isPublished ? 'published' : 'unpublished') +
            ' successfully',
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

  return { publishProject };
};
