import { useMutation } from '@apollo/client';
import { UPDATE_AGENCY } from '../graphql';

export const useUpdateAgency = () => {
  const [updateAgency, { loading, error }] = useMutation(UPDATE_AGENCY, {
    refetchQueries: ['GetAgencyInfo'],
  });

  return { updateAgency, loading, error };
};
