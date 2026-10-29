import { useQuery } from '@apollo/client';
import { useQueryState } from 'erxes-ui';
import { ListQueryResponse, SEGMENTS } from 'ui-modules';

export const useSegments = () => {
  const [selectedContentType] = useQueryState('contentType');

  const { data, loading, error, refetch } = useQuery<ListQueryResponse>(
    SEGMENTS,
    { variables: { contentTypes: [selectedContentType] } },
  );

  return {
    segments: data?.segments ?? [],
    loading,
    error,
    refetch,
    handleRefresh: refetch,
  };
};
