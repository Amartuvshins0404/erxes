import { MutationHookOptions, useMutation } from '@apollo/client';
import { GIVE_TAGS } from 'ui-modules/modules/tags/graphql/tagMutations';
import { toast } from 'erxes-ui';
import {
  GiveTagsMutationResponse,
  GiveTagsMutationVariables,
} from 'ui-modules/modules/tags/types/TagMutationTypes';

export const useGiveTags = (
  options?: MutationHookOptions<
    GiveTagsMutationResponse,
    GiveTagsMutationVariables
  >,
) => {
  const [giveTags, { loading }] = useMutation<
    GiveTagsMutationResponse,
    GiveTagsMutationVariables
  >(GIVE_TAGS, {
    optimisticResponse: { tagsTag: null },
    ...options,
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      options?.onError?.(error);
    },
  });

  return { giveTags, loading };
};
