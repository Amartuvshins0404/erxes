import { UPDATE_Company_INFO } from '@/btk/graphql/btkMutations';
import { BTK_GET_COMPANY_INFO } from '@/btk/graphql/btkQueries';
import { useMutation } from '@apollo/client';

export const useUpdateCompanyInfo = (adminId?: string) => {
  const [updateCompanyInfo, { loading }] = useMutation(UPDATE_Company_INFO, {
    refetchQueries: adminId
      ? [{ query: BTK_GET_COMPANY_INFO, variables: { _id: adminId } }]
      : [],
  });

  return { updateCompanyInfo, loading };
};
