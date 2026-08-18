import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import {
  ONE_FIT_CREDIT_TRANSACTIONS_REMOVE,
  ONE_FIT_CREDIT_TRANSACTION_CREATE,
  ONE_FIT_CREDIT_TRANSACTIONS_BULK_CREATE,
} from '../graphql/creditMutations';
import { ONE_FIT_CREDIT_TRANSACTIONS } from '../graphql/creditQueries';

export function useRemoveCreditTransactions() {
  const [removeCreditTransactionsMutation, { loading }] = useMutation(
    ONE_FIT_CREDIT_TRANSACTIONS_REMOVE,
  );

  const removeCreditTransactions = (ids: string[]) => {
    return removeCreditTransactionsMutation({
      variables: { ids },
      refetchQueries: [{ query: ONE_FIT_CREDIT_TRANSACTIONS }],
      awaitRefetchQueries: true,
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Credit transactions removed successfully',
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

  return { removeCreditTransactions, loading };
}

export function useCreateCreditTransaction() {
  const [createCreditTransactionMutation, { loading }] = useMutation(
    ONE_FIT_CREDIT_TRANSACTION_CREATE,
    {
      refetchQueries: [{ query: ONE_FIT_CREDIT_TRANSACTIONS }],
      awaitRefetchQueries: true,
    },
  );

  const createCreditTransaction = (options: MutationFunctionOptions) => {
    return createCreditTransactionMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_CREDIT_TRANSACTIONS }],
      awaitRefetchQueries: true,
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Credit transaction created successfully',
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

  return { createCreditTransaction, loading };
}

export function useBulkCreateCreditTransactions() {
  const [bulkCreateMutation, { loading }] = useMutation(
    ONE_FIT_CREDIT_TRANSACTIONS_BULK_CREATE,
    {
      refetchQueries: [{ query: ONE_FIT_CREDIT_TRANSACTIONS }],
      awaitRefetchQueries: true,
    },
  );

  const bulkCreateCreditTransactions = (options: MutationFunctionOptions) => {
    return bulkCreateMutation({
      ...options,
      refetchQueries: [{ query: ONE_FIT_CREDIT_TRANSACTIONS }],
      awaitRefetchQueries: true,
      onCompleted: (data) => {
        options.onCompleted?.(data);
        const count =
          (data?.oneFitCreditTransactionsBulkCreate as unknown[])?.length ?? 0;
        toast({
          title: 'Success',
          description: `${count} credit transaction(s) created successfully`,
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

  return { bulkCreateCreditTransactions, loading };
}
