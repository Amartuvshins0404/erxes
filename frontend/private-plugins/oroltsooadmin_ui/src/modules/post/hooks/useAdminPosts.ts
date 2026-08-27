import { QueryHookOptions, useQuery } from '@apollo/client';
import { useMultiQueryState } from 'erxes-ui';

import { useAdminCursorList } from '@/shared/hooks/useAdminCursorList';
import { ADMIN_POSTS_PER_PAGE } from '../constants/postConstants';
import {
  OROLTSOO_ADMIN_POST_DETAIL,
  OROLTSOO_ADMIN_POSTS,
} from '../graphql/queries/postQueries';
import { IAdminPost } from '../types/post';

export const useAdminPosts = (options?: QueryHookOptions) => {
  const [{ searchValue, status, subdomain, tag }] = useMultiQueryState<{
    searchValue: string;
    status: string;
    subdomain: string;
    tag: string;
  }>(['searchValue', 'status', 'subdomain', 'tag']);

  const { list, ...rest } = useAdminCursorList<IAdminPost>({
    document: OROLTSOO_ADMIN_POSTS,
    responseKey: 'oroltsooAdminPosts',
    variables: {
      limit: ADMIN_POSTS_PER_PAGE,
      ...options?.variables,
      searchValue,
      status,
      subdomain,
      tag,
    },
    options,
  });

  return { posts: list, ...rest };
};

export const useAdminPostDetail = (postId?: string) => {
  const { data, loading, error } = useQuery<{
    oroltsooAdminPostDetail: IAdminPost;
  }>(OROLTSOO_ADMIN_POST_DETAIL, {
    variables: { id: postId },
    skip: !postId,
  });

  return { post: data?.oroltsooAdminPostDetail, loading, error };
};
