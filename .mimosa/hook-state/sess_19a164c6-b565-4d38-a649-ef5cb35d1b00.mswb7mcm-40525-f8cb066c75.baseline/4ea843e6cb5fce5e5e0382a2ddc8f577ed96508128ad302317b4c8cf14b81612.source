import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { BLOCK_CREATE_UNIT_TYPE } from '@/unit/graphql/unitMutations';
import { BLOCK_GET_UNIT_TYPES } from '@/unit/graphql/unitQueries';
import { toast } from 'erxes-ui';

export const useUnitTypeCreate = () => {
  const [mutate, { loading }] = useMutation(BLOCK_CREATE_UNIT_TYPE);

  const createUnitType = (options: MutationFunctionOptions) => {
    mutate({
      ...options,
      refetchQueries: ['BlockGetUnitTypes'],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Unit type created successfully',
          variant: 'default',
        });
      },
      onError: (error) => {
        options.onError?.(error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { createUnitType, loading };
};
