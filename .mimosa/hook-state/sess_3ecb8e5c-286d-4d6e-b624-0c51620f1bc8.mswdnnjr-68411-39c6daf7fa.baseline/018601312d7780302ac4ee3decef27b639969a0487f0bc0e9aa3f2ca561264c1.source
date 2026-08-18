import { useQuery } from '@apollo/client';
import { MUSHOP_MEMBERSHIP_PLAN_DETAIL } from '../graphql/queries';

export const useMembershipPlanDetail = (_id?: string | null) => {
  const { data, loading } = useQuery(MUSHOP_MEMBERSHIP_PLAN_DETAIL, {
    variables: { _id },
    skip: !_id,
  });

  return {
    plan: data?.mushopMembershipPlanDetail,
    loading,
  };
};
