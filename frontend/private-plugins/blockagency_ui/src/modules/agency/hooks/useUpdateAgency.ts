import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { GET_AGENCY_INFO, UPDATE_AGENCY } from '../graphql';
import { omitTypename } from '../utils/input';

type AgencyInput = Record<string, unknown>;

type UpdateAgencyData = {
  updateAgencyInfo?: AgencyInput | null;
};

type UpdateAgencyOptions = MutationFunctionOptions<
  UpdateAgencyData,
  { input: AgencyInput }
>;

export const useUpdateAgency = () => {
  const [mutate, { loading, error }] = useMutation<
    UpdateAgencyData,
    { input: AgencyInput }
  >(UPDATE_AGENCY, {
    // The mutation returns the whole agency, so the cache is updated from the
    // response instead of refetching `GetAgencyInfo`. Refetching on every save
    // meant a slow response could land after the next save and push stale
    // values back into the forms that read this query.
    update: (cache, { data }) => {
      const agency = data?.updateAgencyInfo;

      if (!agency) {
        return;
      }

      // `updateAgencyInfo` creates the agency when none exists yet, and the
      // root query field still points at nothing in that case.
      cache.writeQuery({
        query: GET_AGENCY_INFO,
        data: { getAgencyInfo: agency },
      });
    },
    onError: (mutationError) => {
      toast({
        title: 'Error',
        description: mutationError.message,
        variant: 'destructive',
      });
    },
  });

  // Forms are seeded from `getAgencyInfo`, so nested objects still carry the
  // `__typename` apollo added. `AgencyInput` and its nested inputs reject it.
  const updateAgency = (options: UpdateAgencyOptions) =>
    mutate({
      ...options,
      variables: options.variables && {
        input: omitTypename(options.variables.input),
      },
    });

  return { updateAgency, loading, error };
};
