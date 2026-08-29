import { useMutation, useQuery } from '@apollo/client';
import {
  GET_BLOCK_PAYMENT_METHODS,
  GET_CONTRACT_PAYMENT_SETTINGS,
} from '@/contract-payment/graphql/queries';
import { UPDATE_CONTRACT_PAYMENT_SETTINGS } from '@/contract-payment/graphql/mutations';
import {
  IContractPaymentSettings,
  IPaymentMethod,
} from '@/contract-payment/types';

export const useContractPaymentSettings = (projectId?: string) => {
  const { data, loading, error } = useQuery<{
    blockGetContractPaymentSettings: IContractPaymentSettings | null;
  }>(GET_CONTRACT_PAYMENT_SETTINGS, {
    variables: { projectId },
    skip: !projectId,
  });

  return {
    settings: data?.blockGetContractPaymentSettings || null,
    loading,
    error,
  };
};

// Only active methods can take money, so an inactive one is never offered as a
// choice here.
export const usePaymentMethods = () => {
  const { data, loading, error } = useQuery<{ payments: IPaymentMethod[] }>(
    GET_BLOCK_PAYMENT_METHODS,
    { variables: { status: 'active' } },
  );

  return { paymentMethods: data?.payments || [], loading, error };
};

export const useUpdateContractPaymentSettings = (projectId?: string) => {
  const [updateSettings, { loading, error }] = useMutation(
    UPDATE_CONTRACT_PAYMENT_SETTINGS,
    { refetchQueries: ['BlockGetContractPaymentSettings'] },
  );

  const handleUpdate = async (input: {
    paymentIds?: string[];
    allowPartial?: boolean;
  }) => {
    const { data } = await updateSettings({
      variables: { input, projectId },
    });

    return data?.blockUpdateContractPaymentSettings as
      | IContractPaymentSettings
      | undefined;
  };

  return { updateContractPaymentSettings: handleUpdate, loading, error };
};
