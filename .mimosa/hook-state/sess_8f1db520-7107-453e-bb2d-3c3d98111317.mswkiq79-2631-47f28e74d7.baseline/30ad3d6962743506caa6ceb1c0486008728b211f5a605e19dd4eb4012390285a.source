import { useMutation } from '@apollo/client';
import { UPDATE_UNIT_STATUS } from '../graphql/mutations';
import {
  GET_AGENCY_UNITS,
  GET_AGENCY_UNIT_STATUS_COUNTS,
} from '../graphql/queries';

export const useUpdateUnitStatus = () => {
  const [mutate, { loading }] = useMutation(UPDATE_UNIT_STATUS, {
    refetchQueries: [GET_AGENCY_UNITS, GET_AGENCY_UNIT_STATUS_COUNTS],
  });

  const updateStatus = (_id: string, status: string) =>
    mutate({ variables: { _id, status } });

  return { updateStatus, loading };
};
