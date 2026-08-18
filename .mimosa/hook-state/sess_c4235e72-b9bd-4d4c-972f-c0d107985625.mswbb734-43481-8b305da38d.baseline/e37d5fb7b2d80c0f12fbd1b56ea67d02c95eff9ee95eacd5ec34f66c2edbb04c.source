import { useQuery } from '@apollo/client';
import { BTK_GET_COMPANY_LIST, BTK_GET_COMPANIES } from '../graphql/btkQueries';

export const useCompanyList = (list = false) => {
  const { data, loading } = useQuery<{ btkAdminCompanies: any[] }>(
    list ? BTK_GET_COMPANY_LIST : BTK_GET_COMPANIES,
    {
      fetchPolicy: 'cache-and-network',
    },
  );

  return { companies: data?.btkAdminCompanies, loading };
};
