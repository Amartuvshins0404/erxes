import { useQuery } from '@apollo/client';
import { useParams } from 'react-router';
import { GET_OPENCODE } from '../graphql/queries';

export const useOpencode = (identifierId?: string) => {
  const params = useParams();
  const routeIdentifierId = params.id;
  const currentIdentifierId = identifierId || routeIdentifierId;
  const { data, loading, refetch } = useQuery(GET_OPENCODE, {
    skip: !currentIdentifierId,
    variables: { identifierId: currentIdentifierId },
    fetchPolicy: 'network-only',
  });

  return {
    opencode: data?.getOpencode ?? null,
    loading,
    refetch,
  };
};
