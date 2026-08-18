import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import {
  ONE_FIT_MEMBERSHIP_PLAN_CREATE,
  ONE_FIT_MEMBERSHIP_PLAN_UPDATE,
  ONE_FIT_MEMBERSHIP_PLANS_REMOVE,
} from '../graphql/membershipPlanMutations';
import { ONE_FIT_MEMBERSHIP_PLANS } from '../graphql/membershipPlanQueries';

export function useCreateMembershipPlan() {
  const [createMembershipPlanMutation, { loading }] = useMutation(
    ONE_FIT_MEMBERSHIP_PLAN_CREATE,
  );

  const createMembershipPlan = (options: MutationFunctionOptions) => {
    return createMembershipPlanMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_MEMBERSHIP_PLANS }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Membership plan created successfully',
        });
      },
      onError: (error) => {
        options.onError?.(error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { createMembershipPlan, loading };
}

export function useUpdateMembershipPlan() {
  const [updateMembershipPlanMutation, { loading }] = useMutation(
    ONE_FIT_MEMBERSHIP_PLAN_UPDATE,
  );

  const updateMembershipPlan = (options: MutationFunctionOptions) => {
    return updateMembershipPlanMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_MEMBERSHIP_PLANS }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Membership plan updated successfully',
        });
      },
      onError: (error) => {
        options.onError?.(error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { updateMembershipPlan, loading };
}

export function useRemoveMembershipPlans() {
  const [removeMembershipPlansMutation, { loading }] = useMutation(
    ONE_FIT_MEMBERSHIP_PLANS_REMOVE,
  );

  const removeMembershipPlans = (ids: string[]) => {
    return removeMembershipPlansMutation({
      variables: { ids },
      refetchQueries: [{ query: ONE_FIT_MEMBERSHIP_PLANS }],
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Membership plans removed successfully',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { removeMembershipPlans, loading };
}








