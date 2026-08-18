import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import {
  BA_MEMBERSHIP_PLANS,
  BA_MEMBERSHIP_PLAN_DETAIL,
} from '../graphql/queries';
import {
  BA_MEMBERSHIP_PLAN_CREATE,
  BA_MEMBERSHIP_PLAN_DEACTIVATE,
  BA_MEMBERSHIP_PLAN_UPDATE,
} from '../graphql/mutations';
import { IPlanList } from '../types';

export const usePlans = (isActive?: boolean) => {
  const { data, loading } = useQuery<{ baMembershipPlans: IPlanList }>(
    BA_MEMBERSHIP_PLANS,
    { variables: { isActive } },
  );

  return { plans: data?.baMembershipPlans?.list || [], loading };
};

export const usePlanMutations = () => {
  const { t } = useTranslation('blockadmin');

  const onError = (e: { message: string }) =>
    toast({
      title: t('Error'),
      description: e.message,
      variant: 'destructive',
    });

  const refetchQueries = ['BaMembershipPlans'];

  const [createPlan, { loading: creating }] = useMutation(
    BA_MEMBERSHIP_PLAN_CREATE,
    {
      refetchQueries,
      onCompleted: () => toast({ title: t('Plan created') }),
      onError,
    },
  );

  const [updatePlan, { loading: updating }] = useMutation(
    BA_MEMBERSHIP_PLAN_UPDATE,
    {
      refetchQueries,
      onCompleted: () => toast({ title: t('Plan updated') }),
      onError,
    },
  );

  const [deactivatePlan, { loading: deactivating }] = useMutation(
    BA_MEMBERSHIP_PLAN_DEACTIVATE,
    {
      refetchQueries,
      onCompleted: () => toast({ title: t('Plan deactivated') }),
      onError,
    },
  );

  return {
    createPlan,
    updatePlan,
    deactivatePlan,
    loading: creating || updating || deactivating,
  };
};

export const usePlanDetail = (_id?: string | null) => {
  const { data, loading } = useQuery(BA_MEMBERSHIP_PLAN_DETAIL, {
    variables: { _id },
    skip: !_id,
  });

  return { plan: data?.baMembershipPlanDetail ?? null, loading };
};
