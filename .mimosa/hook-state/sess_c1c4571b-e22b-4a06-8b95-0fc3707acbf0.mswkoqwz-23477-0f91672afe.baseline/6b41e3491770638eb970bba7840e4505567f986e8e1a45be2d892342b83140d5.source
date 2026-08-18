import { useQuery } from '@apollo/client';
import { BA_MEMBERSHIP_DETAIL } from '../graphql/queries';
import { IMember } from '../types';

export const useMemberDetail = (_id?: string | null) => {
  const { data, loading } = useQuery<{ baMembershipDetail: IMember }>(
    BA_MEMBERSHIP_DETAIL,
    { variables: { _id }, skip: !_id },
  );

  return { member: data?.baMembershipDetail ?? null, loading };
};
