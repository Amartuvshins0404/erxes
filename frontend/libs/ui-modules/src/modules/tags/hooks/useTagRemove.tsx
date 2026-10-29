import { useMutation } from '@apollo/client';
import { useToast } from 'erxes-ui';
import { REMOVE_TAG } from '../graphql/tagMutations';

export const useTagRemove = () => {
  const { toast } = useToast();
  const [_removeTag, { loading, error }] = useMutation(REMOVE_TAG);
  const removeTag = (id: string) => {
    _removeTag({
      variables: { id },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
      },
    });
  };
  return { removeTag, loading, error };
};
