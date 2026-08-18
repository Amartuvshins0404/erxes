import { useQuery } from '@apollo/client';
import { BTK_GET_ADMIN_SUBMISSIONS } from '../graphql/formsQueries';
import { IForm } from '../types/formTypes';

interface BtkGetAllFormsData {
  btkAdminGetSubmissions: {
    list: IForm[];
    totalCount: number;
  };
}

export const useForms = (enabled = true) => {
  const { data, loading, error, refetch } = useQuery<BtkGetAllFormsData>(
    BTK_GET_ADMIN_SUBMISSIONS,
    {
      fetchPolicy: 'cache-and-network',
      skip: !enabled,
    },
  );

  const forms = data?.btkAdminGetSubmissions?.list ?? [];
  const totalCount = data?.btkAdminGetSubmissions?.totalCount ?? 0;

  return {
    forms,
    totalCount,
    loading,
    error,
    refetch,
  };
};
