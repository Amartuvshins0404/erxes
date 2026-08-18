import { useMutation } from '@apollo/client';
import { GET_IDENTIFIERS } from '../graphql/queries';
import { DELETE_IDENTIFIER } from '../graphql/mutations';

export const useDeleteIdentifier = () => {
  const [remove, { loading }] = useMutation(DELETE_IDENTIFIER, {
    refetchQueries: [
      { query: GET_IDENTIFIERS, variables: { kind: 'assistant' } },
      { query: GET_IDENTIFIERS, variables: { kind: 'agent' } },
    ],
  });

  const deleteIdentifier = async (
    identifierId: string,
    callbacks?: {
      onCompleted?: () => void;
      onError?: (error: Error) => void;
    },
  ) => {
    await remove({
      variables: { identifierId },
      onCompleted: callbacks?.onCompleted,
      onError: callbacks?.onError,
    });
  };

  return {
    deleteIdentifier,
    loading,
  };
};

export const useDeleteAssistantOrg = () => {
  const { deleteIdentifier, loading } = useDeleteIdentifier();

  return {
    deleteOrg: deleteIdentifier,
    loading,
  };
};
