import { OperationVariables, QueryHookOptions, useQuery } from '@apollo/client';
import { EnumCursorDirection, useCursorListQuery } from 'erxes-ui';
import { useCallback, useMemo } from 'react';
import {
  TAGS_LIST_QUERY,
  TAGS_QUERY,
} from 'ui-modules/modules/tags/graphql/tagQueries';
import { ITag } from 'ui-modules/modules/tags/types/Tag';

export const useGetTags = (options?: QueryHookOptions) => {
  const { data, loading, error } = useQuery(TAGS_QUERY, options);
  const { allTags, rootTags, tagsByParentId, tagGroups } = useMemo(() => {
    const allTags = (data?.tagsMain || []) as ITag[];
    const rootTags: ITag[] = [];
    const tagsByParentId: Record<string, ITag[]> = {};
    const tagGroups: ITag[] = [];

    allTags.forEach((tag) => {
      if (tag.isGroup) {
        tagGroups.push(tag);
      }
      if (tag.parentId) {
        if (!tagsByParentId[tag.parentId]) {
          tagsByParentId[tag.parentId] = [];
        }
        tagsByParentId[tag.parentId].push(tag);
      } else {
        rootTags.push(tag);
      }
    });

    return { allTags, rootTags, tagsByParentId, tagGroups };
  }, [data?.tagsMain]);

  return {
    tags: allTags,
    rootTags,
    tagsByParentId,
    tagGroups,
    loading,
    error,
  };
};

export const useTags = ({
  variables,
  skip,
}: { variables?: OperationVariables; skip?: boolean } = {}) => {
  const { list, totalCount, loading, error, handleFetchMore } =
    useCursorListQuery<ITag>(TAGS_LIST_QUERY, {
      field: 'tags',
      variables,
      skip,
    });

  const fetchMore = useCallback(
    () => handleFetchMore({ direction: EnumCursorDirection.FORWARD }),
    [handleFetchMore],
  );

  return {
    tags: list,
    totalCount,
    loading,
    error,
    handleFetchMore: fetchMore,
  };
};
