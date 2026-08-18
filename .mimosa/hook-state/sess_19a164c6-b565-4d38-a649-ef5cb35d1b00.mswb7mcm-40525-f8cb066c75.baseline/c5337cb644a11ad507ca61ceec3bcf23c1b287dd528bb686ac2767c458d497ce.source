import { useQuery } from '@apollo/client';
import { useParams } from 'react-router';
import { GET_IDENTIFIER } from '../graphql/queries';
import type { AssistantOrg, Identifier } from './useAssistantOrgs';

export const useCurrentIdentifierId = () => {
  const params = useParams();
  const identifierId = params.id;

  if (!identifierId) {
    throw new Error('id route param is required');
  }

  return identifierId;
};

export const useIdentifier = (identifierId?: string) => {
  const params = useParams();
  const routeIdentifierId = params.id;
  const currentIdentifierId = identifierId || routeIdentifierId;
  const { data, loading, refetch } = useQuery(GET_IDENTIFIER, {
    variables: { identifierId: currentIdentifierId },
    skip: !currentIdentifierId,
  });

  return {
    identifier: (data?.getIdentifier ?? null) as Identifier | null,
    loading,
    refetch,
  };
};

export const useCurrentAssistantOrgId = useCurrentIdentifierId;

export const useAssistantOrg = (orgId?: string) => {
  const { identifier, loading, refetch } = useIdentifier(orgId);

  return {
    org: identifier as AssistantOrg | null,
    loading,
    refetch,
  };
};
