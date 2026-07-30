import { useMutation } from '@apollo/client';
import { GET_IDENTIFIER, GET_IDENTIFIERS } from '../graphql/queries';
import { UPDATE_IDENTIFIER } from '../graphql/mutations';

export const useUpdateIdentifier = () => {
  const [update, { loading }] = useMutation(UPDATE_IDENTIFIER);

  const updateIdentifier = async (
    identifierId: string,
    input: { name: string; description?: string },
    callbacks?: {
      onCompleted?: () => void;
      onError?: (error: Error) => void;
    },
  ) => {
    await update({
      variables: { identifierId, input },
      refetchQueries: [
        { query: GET_IDENTIFIERS, variables: { kind: 'assistant' } },
        { query: GET_IDENTIFIERS, variables: { kind: 'agent' } },
        { query: GET_IDENTIFIER, variables: { identifierId } },
      ],
      awaitRefetchQueries: true,
      onCompleted: callbacks?.onCompleted,
      onError: callbacks?.onError,
    });
  };

  return {
    updateIdentifier,
    loading,
  };
};

export const useUpdateAssistantOrg = () => {
  const { updateIdentifier, loading } = useUpdateIdentifier();

  return {
    updateOrg: updateIdentifier,
    loading,
  };
};
