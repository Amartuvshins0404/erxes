import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { ASSIGN_UNIT_TO_MEMBER } from '../graphql/mutations';
import { GET_AGENCY_UNITS } from '../graphql/queries';

export const useAssignUnitMember = () => {
  const [mutate, { loading }] = useMutation(ASSIGN_UNIT_TO_MEMBER, {
    refetchQueries: [GET_AGENCY_UNITS],
    onCompleted: () => {
      toast({ title: 'Success', description: 'Member assigned to unit' });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const assignMember = (_id: string, memberId: string | undefined) => {
    return mutate({ variables: { _id, memberId: memberId || null } });
  };

  return { assignMember, loading };
};
