import { useMutation } from '@apollo/client';
import { useToast } from 'erxes-ui';
import { useCallback } from 'react';

import {
  OROLTSOO_POST_ADD,
  OROLTSOO_POST_EDIT,
  OROLTSOO_POST_REMOVE,
} from '../graphql/mutations/postMutations';
import { IPost } from '../types/post';

const POSTS_QUERY_NAME = 'OroltsooPosts';

export const usePostMutations = () => {
  const { toast } = useToast();

  const [add, { loading: adding }] = useMutation<{ oroltsooPostAdd: IPost }>(
    OROLTSOO_POST_ADD,
    { refetchQueries: [POSTS_QUERY_NAME], awaitRefetchQueries: true },
  );

  const [edit, { loading: editing }] = useMutation<{
    oroltsooPostEdit: IPost;
  }>(OROLTSOO_POST_EDIT);

  const [remove, { loading: removing }] = useMutation(OROLTSOO_POST_REMOVE, {
    refetchQueries: [POSTS_QUERY_NAME],
    awaitRefetchQueries: true,
  });

  const onError = useCallback(
    (title: string) => (error: Error) =>
      toast({ title, description: error.message, variant: 'destructive' }),
    [toast],
  );

  const addPost = (input: Record<string, unknown>, onCompleted?: () => void) =>
    add({
      variables: { input },
      onCompleted: () => {
        toast({ title: 'Пост үүслээ', variant: 'success' });
        onCompleted?.();
      },
      onError: onError('Пост үүсгэж чадсангүй'),
    });

  const editPost = (
    id: string,
    input: Record<string, unknown>,
    onCompleted?: () => void,
  ) =>
    edit({
      variables: { id, input },
      onCompleted: () => {
        toast({ title: 'Пост шинэчлэгдлээ', variant: 'success' });
        onCompleted?.();
      },
      onError: onError('Постыг хадгалж чадсангүй'),
    });

  const removePosts = (ids: string[], onCompleted?: () => void) =>
    remove({
      variables: { ids },
      update: (cache) => {
        ids.forEach((id) =>
          cache.evict({
            id: cache.identify({ __typename: 'OroltsooPost', _id: id }),
          }),
        );
        cache.gc();
      },
      onCompleted: () => {
        toast({
          title: ids.length > 1 ? 'Постууд устлаа' : 'Пост устлаа',
          variant: 'success',
        });
        onCompleted?.();
      },
      onError: onError('Постыг устгаж чадсангүй'),
    });

  return { addPost, editPost, removePosts, loading: adding || editing || removing };
};
