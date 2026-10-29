import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { REMOVE_COMPANIES } from '@/contacts/companies/graphql/mutations/removeCompanies';

type RemoveCompaniesVariables = { companyIds: string[] };

export const useRemoveCompanies = () => {
  const [_removeCompanies, { loading }] = useMutation<
    { companiesRemove: string[] },
    RemoveCompaniesVariables
  >(REMOVE_COMPANIES);

  const removeCompanies = (
    options: MutationFunctionOptions<
      { companiesRemove: string[] },
      RemoveCompaniesVariables
    >,
  ) => _removeCompanies(options);

  return { removeCompanies, loading };
};
