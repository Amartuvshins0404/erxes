import { useQuery } from '@apollo/client';
import { MUSHOP_MEMBERSHIP_DETAIL } from '../graphql/queries';
import { IMember } from '../types';

export const useMemberDetail = (_id?: string | null) => {
  const { data, loading } = useQuery<{
    mushopMembershipDetail: IMember;
  }>(MUSHOP_MEMBERSHIP_DETAIL, {
    variables: { _id },
    skip: !_id,
  });

  return { member: data?.mushopMembershipDetail, loading };
};
