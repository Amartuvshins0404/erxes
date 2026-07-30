import { useMutation } from '@apollo/client';
import { MUSHOP_GRANT_MEMBERSHIP } from '../graphql/mutations';
import { MUSHOP_MEMBERSHIPS } from '../graphql/queries';

export const useGrantMembership = () => {
  const [grantMembership, { loading }] = useMutation(
    MUSHOP_GRANT_MEMBERSHIP,
    { refetchQueries: [{ query: MUSHOP_MEMBERSHIPS }] },
  );

  const handleGrant = (
    customerId: string,
    planId: string,
    paymentId?: string,
    amount?: number,
  ) => {
    return grantMembership({
      variables: { customerId, planId, paymentId, amount },
    });
  };

  return { handleGrant, loading };
};
