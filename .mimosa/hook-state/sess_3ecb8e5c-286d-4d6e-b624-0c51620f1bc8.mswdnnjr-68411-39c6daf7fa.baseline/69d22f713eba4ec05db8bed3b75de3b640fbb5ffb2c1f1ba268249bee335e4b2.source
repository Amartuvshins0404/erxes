import { useQuery } from '@apollo/client';
import {
  GET_PAYMENT_PLANS_BY_PROJECT,
  GET_PAYMENT_PLAN,
} from '../graphql/paymentPlanQueries';
import { IPaymentPlan } from '../types/paymentPlanTypes';
import { useParams } from 'react-router-dom';
import { useQueryState } from 'erxes-ui';

export const usePaymentPlansByProject = () => {
  const { id, projectId: projectIdParam } = useParams<{
    id?: string;
    projectId?: string;
  }>();
  const [projectIdQuery] = useQueryState('projectId');
  const project = id || projectIdParam || projectIdQuery;
  const { data, loading, error, refetch } = useQuery<{
    blockGetProjectPaymentPlans: IPaymentPlan[];
  }>(GET_PAYMENT_PLANS_BY_PROJECT, {
    variables: { project },
    skip: !project,
  });

  return {
    paymentPlans: data?.blockGetProjectPaymentPlans,
    loading,
    error,
    refetch,
  };
};

export const usePaymentPlan = (paymentPlanId?: string) => {
  const { data, loading, error } = useQuery<{
    blockGetPaymentPlan: IPaymentPlan;
  }>(GET_PAYMENT_PLAN, {
    variables: { id: paymentPlanId },
    skip: !paymentPlanId,
  });

  return {
    paymentPlan: data?.blockGetPaymentPlan,
    loading,
    error,
  };
};
