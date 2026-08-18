import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import {
  ONE_FIT_MEMBERSHIP_PURCHASE_ACTIVATE,
  ONE_FIT_MEMBERSHIP_PURCHASES_BULK_CREATE,
  ONE_FIT_MEMBERSHIP_PURCHASE_CREATE,
  ONE_FIT_MEMBERSHIP_PURCHASE_REMOVE,
} from '../graphql/membershipPurchaseMutations';
import { ONE_FIT_MEMBERSHIP_PURCHASES } from '../graphql/membershipPurchaseQueries';

export function useCreateMembershipPurchase() {
  const [createMembershipPurchaseMutation, { loading }] = useMutation(
    ONE_FIT_MEMBERSHIP_PURCHASE_CREATE,
  );

  function createMembershipPurchase(options: MutationFunctionOptions) {
    return createMembershipPurchaseMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_MEMBERSHIP_PURCHASES }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Membership purchase created successfully',
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
  }

  return { createMembershipPurchase, loading };
}

export function useActivateMembershipPurchase() {
  const [activateMembershipPurchaseMutation, { loading }] = useMutation(
    ONE_FIT_MEMBERSHIP_PURCHASE_ACTIVATE,
  );

  function activateMembershipPurchase(options: MutationFunctionOptions) {
    return activateMembershipPurchaseMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_MEMBERSHIP_PURCHASES }],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Membership activated successfully',
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
  }

  return { activateMembershipPurchase, loading };
}

export function useDeleteMembershipPurchase() {
  const [deleteMembershipPurchaseMutation, { loading }] = useMutation(
    ONE_FIT_MEMBERSHIP_PURCHASE_REMOVE,
  );

  function deleteMembershipPurchase(options: MutationFunctionOptions) {
    return deleteMembershipPurchaseMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_MEMBERSHIP_PURCHASES }],
      awaitRefetchQueries: true,
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Membership purchase deleted successfully',
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
  }

  return { deleteMembershipPurchase, loading };
}

export function useBulkCreateMembershipPurchases() {
  const [bulkCreateMembershipPurchasesMutation, { loading }] = useMutation(
    ONE_FIT_MEMBERSHIP_PURCHASES_BULK_CREATE,
  );

  function bulkCreateMembershipPurchases(options: MutationFunctionOptions) {
    return bulkCreateMembershipPurchasesMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_MEMBERSHIP_PURCHASES }],
      awaitRefetchQueries: true,
      onCompleted: (data) => {
        options.onCompleted?.(data);
        const createdCount =
          (data?.oneFitMembershipPurchasesBulkCreate as unknown[])?.length ?? 0;
        toast({
          title: 'Success',
          description: `${createdCount} membership purchase(s) created successfully`,
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
  }

  return { bulkCreateMembershipPurchases, loading };
}
