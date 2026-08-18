import { BLOCK_REMOVE_UNIT_TYPE } from '@/unit/graphql/unitMutations';
import { useMutation } from '@apollo/client';
import { BLOCK_GET_UNIT_TYPES } from '../graphql/unitQueries';
import { toast } from 'erxes-ui';

export const useUnitTypeRemove = () => {
  const [mutate] = useMutation(BLOCK_REMOVE_UNIT_TYPE, {
    refetchQueries: [BLOCK_GET_UNIT_TYPES],
  });

  const removeUnitType = (id: string) => {
    return mutate({
      variables: {
        id,
      },
      onCompleted: (data) => {
        if (!data) return;

        toast({
          title: 'Success',
          description: 'Unit removed successfully',
          variant: 'default',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { removeUnitType };
};
