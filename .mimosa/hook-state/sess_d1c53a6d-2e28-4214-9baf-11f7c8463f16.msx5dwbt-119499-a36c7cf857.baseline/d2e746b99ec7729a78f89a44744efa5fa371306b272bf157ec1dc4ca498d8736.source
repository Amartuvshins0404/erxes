import { UPDATE_Company_INFO } from '@/btk/graphql/btkMutations';
import { BTK_GET_COMPANY_LIST } from '@/btk/graphql/btkQueries';
import { useMutation } from '@apollo/client';

export const useUpdateCompanyInfo = () => {
  const [updateCompanyInfo, { loading }] = useMutation(UPDATE_Company_INFO, {
    refetchQueries: [{ query: BTK_GET_COMPANY_LIST }],
  });

  return { updateCompanyInfo, loading };
};
