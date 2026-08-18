import { useMutation } from '@apollo/client';
import { DELETE_OPPTY_MUTATION } from '@/oppty/graphql/mutations/deleteOppty';
import { GET_OPPTYS } from '@/oppty/graphql/queries/getOpptys';

export const useDeleteOppty = () => {
  const [removeOppty, { loading }] = useMutation(DELETE_OPPTY_MUTATION, {
    refetchQueries: [GET_OPPTYS],
  });

  return { removeOppty, loading };
};
