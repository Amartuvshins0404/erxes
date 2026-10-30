import { MutationHookOptions, useMutation } from '@apollo/client';
import { COMPANIES_ADD } from '../graphql/mutations/addCompanies';
import { ICompany } from '../types';

type AddCompanyResult = { companiesAdd: ICompany };

export function useAddCompany(options?: MutationHookOptions<AddCompanyResult>) {
  const [companiesAdd, { loading, error }] = useMutation<AddCompanyResult>(
    COMPANIES_ADD,
    options,
  );

  return { companiesAdd, loading, error };
}
