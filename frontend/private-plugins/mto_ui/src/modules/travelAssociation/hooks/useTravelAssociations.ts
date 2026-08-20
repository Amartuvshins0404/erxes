import { useQuery } from '@apollo/client';
import { useNonNullMultiQueryState } from 'erxes-ui';
import { MTO_TRAVEL_ASSOCIATIONS } from '@/travelAssociation/graphql/travelAssociationQueries';
import { MtoTravelAssociation } from '@/travelAssociation/types/travelAssociation';

const toIsoDate = (value?: string, endOfDay?: boolean): string | undefined => {
  if (!value) return undefined;

  const date = new Date(endOfDay ? `${value}T23:59:59` : value);

  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
};

export function useTravelAssociations() {
  const { searchValue, foundDateFrom, foundDateTo } =
    useNonNullMultiQueryState<{
      searchValue: string;
      foundDateFrom: string;
      foundDateTo: string;
    }>(['searchValue', 'foundDateFrom', 'foundDateTo']);

  const { data, loading, refetch } = useQuery(MTO_TRAVEL_ASSOCIATIONS, {
    variables: {
      searchValue: searchValue || undefined,
      foundDateFrom: toIsoDate(foundDateFrom),
      foundDateTo: toIsoDate(foundDateTo, true),
    },
    fetchPolicy: 'cache-and-network',
  });

  const travelAssociations: MtoTravelAssociation[] =
    data?.mtoTravelAssociations ?? [];

  return { travelAssociations, loading, refetch };
}
