import { useQuery } from '@apollo/client';
import { GET_POS_CONFIGS } from '../graphql/posQueries';

export interface IPosConfig {
  _id: string;
  name: string;
  token: string;
}

export const usePosConfigs = () => {
  const { data, loading } = useQuery<{ posclientConfigs: IPosConfig[] }>(
    GET_POS_CONFIGS,
  );

  return { posConfigs: data?.posclientConfigs || [], loading };
};
