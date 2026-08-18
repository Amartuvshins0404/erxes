import { useMutation } from '@apollo/client';
import { GET_IDENTIFIERS } from '../graphql/queries';
import { CREATE_IDENTIFIER } from '../graphql/mutations';

export const useCreateIdentifier = () => {
  const [create, { loading }] = useMutation(CREATE_IDENTIFIER, {
    refetchQueries: [{ query: GET_IDENTIFIERS }],
  });

  const createIdentifier = async (
    input: {
      name: string;
      kind: 'assistant' | 'agent';
      description?: string;
    },
    callbacks?: {
      onCompleted?: (identifierId: string) => void;
      onError?: (error: Error) => void;
    },
  ) => {
    try {
      const { data } = await create({
        variables: { input },
      });

      callbacks?.onCompleted?.(data?.createIdentifier?._id);

      return data?.createIdentifier ?? null;
    } catch (error) {
      callbacks?.onError?.(error as Error);
      throw error;
    }
  };

  return {
    createIdentifier,
    loading,
  };
};

export const useCreateAssistantOrg = () => {
  const { createIdentifier, loading } = useCreateIdentifier();

  return {
    createOrg: createIdentifier,
    loading,
  };
};
