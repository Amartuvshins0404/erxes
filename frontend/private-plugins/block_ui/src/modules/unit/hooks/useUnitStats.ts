import { useQuery } from '@apollo/client';
import {
  UNIT_OFFERS_COUNT,
  UNIT_CONTRACTS_COUNT,
  UNIT_OPPTYS_COUNT,
  UNIT_OFFER_STATS,
} from '@/unit/graphql/unitStatsQueries';

export const useUnitOffersCount = (unitId?: string) => {
  const { data, loading } = useQuery<{
    blockGetOffersList: { totalCount: number };
  }>(UNIT_OFFERS_COUNT, { variables: { unitId }, skip: !unitId });
  return { count: data?.blockGetOffersList?.totalCount, loading };
};

export const useUnitContractsCount = (unitId?: string) => {
  const { data, loading } = useQuery<{
    blockGetContractsList: { totalCount: number };
  }>(UNIT_CONTRACTS_COUNT, { variables: { unitId }, skip: !unitId });
  return { count: data?.blockGetContractsList?.totalCount, loading };
};

export const useUnitOpptysCount = (unitId?: string, projectId?: string) => {
  const { data, loading } = useQuery<{
    blockGetOpptys: { totalCount: number };
  }>(UNIT_OPPTYS_COUNT, {
    variables: { unitId, projectId },
    skip: !unitId || !projectId,
  });
  return { count: data?.blockGetOpptys?.totalCount, loading };
};

export interface IUnitOfferStats {
  totalCount: number;
  sentCount: number;
  draftCount: number;
  averageAmount: number | null;
  highestAmount: number | null;
  lowestAmount: number | null;
  currency: string | null;
}

export const useUnitOfferStats = (unitId?: string) => {
  const { data, loading } = useQuery<{
    blockGetUnitOfferStats: IUnitOfferStats;
  }>(UNIT_OFFER_STATS, { variables: { unitId }, skip: !unitId });
  return { stats: data?.blockGetUnitOfferStats ?? null, loading };
};
