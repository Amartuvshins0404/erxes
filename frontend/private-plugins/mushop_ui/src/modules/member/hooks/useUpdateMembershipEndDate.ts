import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { MUSHOP_UPDATE_MEMBERSHIP_END_DATE } from '../graphql/mutations';
import {
  MUSHOP_MEMBERSHIPS,
  MUSHOP_MEMBERSHIP_DETAIL,
} from '../graphql/queries';

export const useUpdateMembershipEndDate = () => {
  const { t } = useTranslation('mushop');
  const [mutate, { loading }] = useMutation(
    MUSHOP_UPDATE_MEMBERSHIP_END_DATE,
    {
      onCompleted: () => toast({ title: t('End date updated') }),
      onError: (e) =>
        toast({
          title: t('Error'),
          description: e.message,
          variant: 'destructive',
        }),
    },
  );

  const updateEndDate = (_id: string, endDate: Date) =>
    mutate({
      variables: { _id, endDate },
      refetchQueries: [
        { query: MUSHOP_MEMBERSHIPS },
        { query: MUSHOP_MEMBERSHIP_DETAIL, variables: { _id } },
      ],
    });

  return { updateEndDate, loading };
};
