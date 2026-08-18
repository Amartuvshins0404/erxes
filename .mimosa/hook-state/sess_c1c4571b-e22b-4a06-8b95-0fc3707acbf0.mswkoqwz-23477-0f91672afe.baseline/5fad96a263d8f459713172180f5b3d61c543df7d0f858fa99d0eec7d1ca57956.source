import { MutationFunctionOptions, useMutation } from '@apollo/client';
import {
  CREATE_PAYMENT_PLAN,
  UPDATE_PAYMENT_PLAN,
  REMOVE_PAYMENT_PLAN,
} from '@/pricing/graphql/paymentPlanMutations';
import { GET_PAYMENT_PLANS_BY_PROJECT } from '@/pricing/graphql/paymentPlanQueries';
import { IPaymentPlanInput } from '@/pricing/types/paymentPlanTypes';
import { toast } from 'erxes-ui';
import { useParams } from 'react-router-dom';

export function useCreatePaymentPlan() {
  const [createPaymentPlanMutation, { loading }] =
    useMutation(CREATE_PAYMENT_PLAN);
  const { id: project } = useParams();

  const createPaymentPlan = (options: MutationFunctionOptions) => {
    return createPaymentPlanMutation({
      ...options,
      variables: { input: { ...options.variables?.input, project } },
      refetchQueries: [
        { query: GET_PAYMENT_PLANS_BY_PROJECT, variables: { project } },
      ],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Payment plan created successfully',
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

  return { createPaymentPlan, loading };
}

export function useUpdatePaymentPlan() {
  const [updatePaymentPlanMutation] = useMutation(UPDATE_PAYMENT_PLAN);

  return ({ input, id }: { input: Partial<IPaymentPlanInput>; id: string }) => {
    return updatePaymentPlanMutation({
      variables: { id, input },
      update: (cache, { data }) => {
        if (data?.blockUpdateProjectPaymentPlan) {
          cache.modify({
            id: cache.identify(data.blockUpdateProjectPaymentPlan),
            fields: Object.keys(input).reduce(
              (fields: Record<string, () => any>, field) => {
                fields[field] = () => input[field as keyof IPaymentPlanInput];
                return fields;
              },
              {},
            ),
            optimistic: true,
          });
        }
      },
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Payment plan updated successfully',
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
}

export function useRemovePaymentPlan() {
  const [removePaymentPlanMutation] = useMutation(REMOVE_PAYMENT_PLAN);
  const { id: project } = useParams();

  return ({ id }: { id: string }) => {
    return removePaymentPlanMutation({
      variables: { id },
      refetchQueries: [
        { query: GET_PAYMENT_PLANS_BY_PROJECT, variables: { project } },
      ],
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Payment plan removed successfully',
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
}
