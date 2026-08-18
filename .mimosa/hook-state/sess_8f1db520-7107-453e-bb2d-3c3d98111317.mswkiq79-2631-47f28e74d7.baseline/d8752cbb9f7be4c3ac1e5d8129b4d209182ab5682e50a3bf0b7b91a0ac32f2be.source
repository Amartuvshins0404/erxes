import { useMutation } from '@apollo/client';
import { GET_IDENTIFIER, GET_IDENTIFIERS } from '../graphql/queries';
import { INVITE_IDENTIFIER_MEMBERS } from '../graphql/mutations';

export const useInviteIdentifierMembers = () => {
  const [invite, { loading }] = useMutation(INVITE_IDENTIFIER_MEMBERS);

  const inviteIdentifierMembers = async (
    identifierId: string,
    memberIds: string[],
    callbacks?: {
      onCompleted?: () => void;
      onError?: (error: Error) => void;
    },
  ) => {
    await invite({
      variables: {
        identifierId,
        input: { memberIds },
      },
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
    inviteIdentifierMembers,
    loading,
  };
};

export const useInviteAssistantOrgMembers = () => {
  const { inviteIdentifierMembers, loading } = useInviteIdentifierMembers();

  return {
    inviteOrgMembers: inviteIdentifierMembers,
    loading,
  };
};
