import { MutationHookOptions, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { EDIT_TAG } from '../graphql/tagMutations';

export const useTagEdit = () => {
  const [editTag, { loading }] = useMutation(EDIT_TAG);

  const mutate = (options: MutationHookOptions) => {
    editTag({
      ...options,
      onCompleted: (data) => {
        if (data?.tagsEdit) {
          toast({ title: 'Tag updated successfully!' });
        }
        options.onCompleted?.(data);
      },
      onError: (error) => {
        toast({
          title: error?.message || 'Failed to update tag',
          variant: 'destructive',
        });
        options.onError?.(error);
      },
    });
  };

  return {
    editTag: mutate,
    loading,
  };
};
