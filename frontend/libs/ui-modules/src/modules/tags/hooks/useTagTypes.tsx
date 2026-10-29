import { useQuery } from '@apollo/client';
import { TAGS_TYPES } from 'ui-modules/modules/tags/graphql/tagTypeQuery';
import { ITagTypes } from 'ui-modules/modules/tags/types/Tag';

export const useTagTypes = () => {
  const { data, error, loading } = useQuery<ITagTypes>(TAGS_TYPES);
  return {
    types: data?.tagsGetTypes || {},
    loading,
    error,
  };
};
