import { useMutation, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  mergeCursorData,
  validateFetchMore,
} from 'erxes-ui';
import {
  GET_CONTRACT_PAYMENTS,
  GET_PAYMENT_TRANSACTIONS,
  GET_PROJECT_PAYMENTS,
} from '@/contract-payment/graphql/queries';
import {
  ADD_PAYMENT_TRANSACTION,
  REMOVE_PAYMENT_TRANSACTION,
  UPDATE_PAYMENT_TRANSACTION,
} from '@/contract-payment/graphql/mutations';
import {
  IContractPayment,
  IContractPaymentTransaction,
} from '@/contract-payment/types';

const PAYMENTS_PER_PAGE = 30;

type ProjectPaymentsResponse = {
  blockGetProjectPayments: {
    list: IContractPayment[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
    totalCount: number;
  };
};

export const useProjectPayments = (
  projectId?: string,
  paid?: boolean,
  contractNumber?: string,
  customerId?: string,
  unitNumber?: string,
) => {
  const { data, loading, refetch, fetchMore } =
    useQuery<ProjectPaymentsResponse>(GET_PROJECT_PAYMENTS, {
      variables: { projectId, paid, contractNumber, customerId, unitNumber, limit: PAYMENTS_PER_PAGE },
      skip: !projectId,
      notifyOnNetworkStatusChange: true,
    });

  const list = data?.blockGetProjectPayments?.list || [];
  const pageInfo = data?.blockGetProjectPayments?.pageInfo;
  const totalCount = data?.blockGetProjectPayments?.totalCount || 0;

  const handleFetchMore = ({
    direction,
  }: {
    direction: EnumCursorDirection;
  }) => {
    if (
      !validateFetchMore({
        direction,
        pageInfo,
      })
    ) {
      return;
    }

    fetchMore({
      variables: {
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        direction:
          direction === EnumCursorDirection.FORWARD ? 'forward' : 'backward',
        limit: PAYMENTS_PER_PAGE,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          blockGetProjectPayments: mergeCursorData<IContractPayment>({
            direction,
            fetchMoreResult: fetchMoreResult.blockGetProjectPayments as any,
            prevResult: prev.blockGetProjectPayments as any,
          }) as any,
        });
      },
    });
  };

  return {
    payments: list,
    pageInfo,
    totalCount,
    handleFetchMore,
    loading,
    refetch,
  };
};

type ContractPaymentsResponse = {
  blockGetContractPayments: {
    list: IContractPayment[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
    totalCount: number;
  };
};

export const useContractPayments = (contractId?: string) => {
  const { data, loading, refetch, fetchMore } =
    useQuery<ContractPaymentsResponse>(GET_CONTRACT_PAYMENTS, {
      variables: { contractId, limit: PAYMENTS_PER_PAGE },
      skip: !contractId,
      notifyOnNetworkStatusChange: true,
    });

  const list = data?.blockGetContractPayments?.list || [];
  const pageInfo = data?.blockGetContractPayments?.pageInfo;
  const totalCount = data?.blockGetContractPayments?.totalCount || 0;

  const handleFetchMore = ({
    direction,
  }: {
    direction: EnumCursorDirection;
  }) => {
    if (!validateFetchMore({ direction, pageInfo })) {
      return;
    }

    fetchMore({
      variables: {
        contractId,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        direction:
          direction === EnumCursorDirection.FORWARD ? 'forward' : 'backward',
        limit: PAYMENTS_PER_PAGE,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          blockGetContractPayments: mergeCursorData<IContractPayment>({
            direction,
            fetchMoreResult: fetchMoreResult.blockGetContractPayments as any,
            prevResult: prev.blockGetContractPayments as any,
          }) as any,
        });
      },
    });
  };

  return {
    payments: list,
    pageInfo,
    totalCount,
    handleFetchMore,
    loading,
    refetch,
  };
};

const TXS_REFETCH = [
  'BlockGetPaymentTransactions',
  'BlockGetContractPayments',
  'BlockGetProjectPayments',
];

export const usePaymentTransactions = (paymentId?: string) => {
  const { data, loading, refetch } = useQuery<{
    blockGetPaymentTransactions: IContractPaymentTransaction[];
  }>(GET_PAYMENT_TRANSACTIONS, {
    variables: { paymentId },
    skip: !paymentId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    transactions: data?.blockGetPaymentTransactions || [],
    loading,
    refetch,
  };
};

export const useAddPaymentTransaction = () => {
  const [addTransaction, { loading }] = useMutation(ADD_PAYMENT_TRANSACTION, {
    refetchQueries: TXS_REFETCH,
  });
  return {
    addTransaction: async (input: {
      paymentId: string;
      amount: number;
      date?: string;
      note?: string;
      paymentMethod?: string;
    }) => {
      const { data } = await addTransaction({ variables: input });
      return data?.blockAddPaymentTransaction;
    },
    loading,
  };
};

export const useUpdatePaymentTransaction = () => {
  const [updateTransaction, { loading }] = useMutation(
    UPDATE_PAYMENT_TRANSACTION,
    { refetchQueries: TXS_REFETCH },
  );
  return {
    updateTransaction: async (input: {
      id: string;
      amount?: number;
      date?: string;
      note?: string;
      paymentMethod?: string;
    }) => {
      const { data } = await updateTransaction({ variables: input });
      return data?.blockUpdatePaymentTransaction;
    },
    loading,
  };
};

export const useRemovePaymentTransaction = () => {
  const [removeTransaction, { loading }] = useMutation(
    REMOVE_PAYMENT_TRANSACTION,
    { refetchQueries: TXS_REFETCH },
  );
  return {
    removeTransaction: async (id: string) => {
      const { data } = await removeTransaction({ variables: { id } });
      return data?.blockRemovePaymentTransaction;
    },
    loading,
  };
};
