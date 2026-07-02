import { useMutation } from '@apollo/client';
import { MUSHOP_CANCEL_MEMBERSHIP } from '../graphql/mutations';
import { MUSHOP_MEMBERSHIPS } from '../graphql/queries';

export const useCancelMembership = () => {
  const [cancelMembership, { loading }] = useMutation(
    MUSHOP_CANCEL_MEMBERSHIP,
    { refetchQueries: [{ query: MUSHOP_MEMBERSHIPS }] },
  );

  const handleCancel = (_id: string) => {
    return cancelMembership({ variables: { _id } });
  };

  return { handleCancel, loading };
};
