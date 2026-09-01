import { MutationFunctionOptions, useMutation } from '@apollo/client';
import {
  CREATE_CONTRACT,
  UPDATE_CONTRACT,
  UPDATE_CONTRACT_STATUS,
} from '../graphql/contractMutations';
import { IContract, IContractInput } from '../types/contractTypes';

// Both contract views must refresh after any write: the board reads
// `BlockGetContracts`, the record table reads the cursor-paginated
// `BlockGetContractsList`. Never narrow this list at a call site — mutate-level
// `refetchQueries` replaces these rather than adding to them.
const COMMON_REFETCH = [
  'BlockGetContracts',
  'BlockGetContract',
  'BlockGetContractPayments',
  'BlockGetContractsList',
];

type ContractMutationOptions = Omit<
  MutationFunctionOptions,
  'variables' | 'refetchQueries'
>;

export function useCreateContract() {
  const [createContract, { loading, error }] = useMutation(CREATE_CONTRACT, {
    refetchQueries: COMMON_REFETCH,
    // Hold the mutation open until both lists have refetched, so the form only
    // closes once the new contract is actually on screen.
    awaitRefetchQueries: true,
  });

  const handleCreate = async (
    input: IContractInput,
    options?: ContractMutationOptions,
  ): Promise<IContract | undefined> => {
    const { data } = await createContract({
      ...options,
      variables: { input },
    });

    return data?.blockCreateContract;
  };

  return { createContract: handleCreate, loading, error };
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
