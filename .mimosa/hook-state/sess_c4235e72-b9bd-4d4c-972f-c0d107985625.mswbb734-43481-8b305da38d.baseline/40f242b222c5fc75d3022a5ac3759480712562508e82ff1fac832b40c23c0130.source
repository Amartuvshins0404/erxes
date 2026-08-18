import { useQuery } from '@apollo/client';
import { BTK_GET_COMPANY_INFO } from '../graphql/btkQueries';

export const useCompanyInfo = (_id?: string) => {
  const { data, loading, error } = useQuery(BTK_GET_COMPANY_INFO, {
    variables: { _id },
    skip: !_id,
  });
  const { btkAdminCompanyInfo: companyInfo } = data || {};
  return { loading, error, companyInfo };
};
