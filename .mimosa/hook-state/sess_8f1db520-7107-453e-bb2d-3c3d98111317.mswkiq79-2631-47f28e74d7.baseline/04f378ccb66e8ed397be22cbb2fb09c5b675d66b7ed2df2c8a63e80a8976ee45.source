import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import {
  ONE_FIT_PROMO_CODE_CREATE,
  ONE_FIT_PROMO_CODE_UPDATE,
  ONE_FIT_PROMO_CODES_REMOVE,
} from '../graphql/promoCodeMutations';
import { ONE_FIT_PROMO_CODES } from '../graphql/promoCodeQueries';

export function useCreatePromoCode() {
  const [createPromoCodeMutation, { loading }] = useMutation(
    ONE_FIT_PROMO_CODE_CREATE,
  );

  const createPromoCode = (options: MutationFunctionOptions) => {
    return createPromoCodeMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_PROMO_CODES }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Promo code created successfully',
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

  return { createPromoCode, loading };
}

export function useUpdatePromoCode() {
  const [updatePromoCodeMutation, { loading }] = useMutation(
    ONE_FIT_PROMO_CODE_UPDATE,
  );

  const updatePromoCode = (options: MutationFunctionOptions) => {
    return updatePromoCodeMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_PROMO_CODES }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Promo code updated successfully',
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

  return { updatePromoCode, loading };
}

export function useRemovePromoCodes() {
  const [removePromoCodesMutation, { loading }] = useMutation(
    ONE_FIT_PROMO_CODES_REMOVE,
  );

  const removePromoCodes = (options: MutationFunctionOptions) => {
    return removePromoCodesMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_PROMO_CODES }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Promo code(s) removed successfully',
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

  return { removePromoCodes, loading };
}
