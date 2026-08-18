import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import {
  BA_CANCEL_MEMBERSHIP,
  BA_GRANT_MEMBERSHIP,
  BA_UPDATE_MEMBERSHIP_END_DATE,
  BA_UPDATE_MEMBERSHIP_STATUS,
} from '../graphql/mutations';
import { BA_MEMBERSHIPS, BA_MEMBERSHIP_DETAIL } from '../graphql/queries';

export const useGrantMembership = () => {
  const [grantMembership, { loading }] = useMutation(BA_GRANT_MEMBERSHIP, {
    refetchQueries: [{ query: BA_MEMBERSHIPS }],
  });

  const handleGrant = (
    customerId: string,
    planId: string,
    paymentId?: string,
    amount?: number,
  ) =>
    grantMembership({
      variables: { customerId, planId, paymentId, amount },
    });

  return { handleGrant, loading };
};

export const useCancelMembership = () => {
  const [cancelMembership, { loading }] = useMutation(BA_CANCEL_MEMBERSHIP, {
    refetchQueries: [{ query: BA_MEMBERSHIPS }],
  });

  const handleCancel = (_id: string) =>
    cancelMembership({ variables: { _id } });

  return { handleCancel, loading };
};

export const useUpdateMembershipStatus = () => {
  const { t } = useTranslation('blockadmin');
  const [mutate, { loading }] = useMutation(BA_UPDATE_MEMBERSHIP_STATUS, {
    onCompleted: () => toast({ title: t('Status updated') }),
    onError: (e) =>
      toast({
        title: t('Error'),
        description: e.message,
        variant: 'destructive',
      }),
  });

  const updateStatus = (_id: string, status: string) =>
    mutate({
      variables: { _id, status },
      refetchQueries: [
        { query: BA_MEMBERSHIPS },
        { query: BA_MEMBERSHIP_DETAIL, variables: { _id } },
      ],
    });

  return { updateStatus, loading };
};

export const useUpdateMembershipEndDate = () => {
  const { t } = useTranslation('blockadmin');
  const [mutate, { loading }] = useMutation(BA_UPDATE_MEMBERSHIP_END_DATE, {
    onCompleted: () => toast({ title: t('End date updated') }),
    onError: (e) =>
      toast({
        title: t('Error'),
        description: e.message,
        variant: 'destructive',
      }),
  });

  const updateEndDate = (_id: string, endDate: Date) =>
    mutate({
      variables: { _id, endDate },
      refetchQueries: [
        { query: BA_MEMBERSHIPS },
        { query: BA_MEMBERSHIP_DETAIL, variables: { _id } },
      ],
    });

  return { updateEndDate, loading };
};
