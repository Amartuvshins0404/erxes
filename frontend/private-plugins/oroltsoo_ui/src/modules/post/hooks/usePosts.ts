import { QueryHookOptions } from '@apollo/client';

import { useCursorList } from '@/shared/hooks/useCursorList';
import {
  POSTS_CURSOR_SESSION_KEY,
  POSTS_PER_PAGE,
} from '../constants/postConstants';
import { OROLTSOO_POSTS } from '../graphql/queries/postQueries';
import { IPost } from '../types/post';

export const usePosts = (options?: QueryHookOptions) => {
  const { list, ...rest } = useCursorList<IPost>({
    document: OROLTSOO_POSTS,
    responseKey: 'oroltsooPosts',
    sessionKey: POSTS_CURSOR_SESSION_KEY,
    perPage: POSTS_PER_PAGE,
    options,
  });

  return { posts: list, ...rest };
};
