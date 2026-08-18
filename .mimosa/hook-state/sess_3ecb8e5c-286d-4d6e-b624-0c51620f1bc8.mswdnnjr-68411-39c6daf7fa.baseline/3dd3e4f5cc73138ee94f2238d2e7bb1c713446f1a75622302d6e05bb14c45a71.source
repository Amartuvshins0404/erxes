import { useMutation } from '@apollo/client';
import {
  CREATE_CONTRACT,
  UPDATE_CONTRACT,
  UPDATE_CONTRACT_STATUS,
} from '../graphql/contractMutations';
import { IContractInput } from '../types/contractTypes';
import { GET_CONTRACTS, GET_CONTRACT } from '../graphql/contractQueries';
import { useQueryState } from 'erxes-ui';

const COMMON_REFETCH = [
  'BlockGetContracts',
  'BlockGetContract',
  'BlockGetContractPayments',
  'BlockGetContractsList',
];

export function useCreateContract() {
  const [unitId] = useQueryState<string>('unitId');
  const [createContract, { loading, error }] = useMutation(CREATE_CONTRACT, {
    refetchQueries: COMMON_REFETCH,
  });

  return { createContract, loading, error };
}

export function useUpdateContractStatus() {
  const [updateStatus, { loading, error }] = useMutation(
    UPDATE_CONTRACT_STATUS,
    {
      refetchQueries: COMMON_REFETCH,
    },
  );

  const handleUpdateStatus = async (id: string, status: string) => {
    const { data } = await updateStatus({ variables: { id, status } });
    return data?.blockUpdateContractStatus;
  };

  return { updateContractStatus: handleUpdateStatus, loading, error };
}

export function useUpdateContract() {
  const [updateContract, { loading, error }] = useMutation(UPDATE_CONTRACT, {
    refetchQueries: COMMON_REFETCH,
  });

  const handleUpdate = async (id: string, input: IContractInput) => {
    const { data } = await updateContract({
      variables: { id, input },
    });
    return data?.blockUpdateContract;
  };

  return { updateContract: handleUpdate, loading, error };
}
