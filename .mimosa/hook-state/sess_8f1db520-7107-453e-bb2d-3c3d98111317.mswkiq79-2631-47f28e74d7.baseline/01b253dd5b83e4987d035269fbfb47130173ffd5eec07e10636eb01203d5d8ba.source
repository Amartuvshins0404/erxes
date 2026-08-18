import { MutationFunctionOptions, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { BLOCK_CREATE_UNIT } from '@/unit/graphql/unitMutations';
import { BLOCK_GET_UNITS } from '@/unit/graphql/unitQueries';

export const useUnitCreate = ({ zoning }: { zoning: string }) => {
  const [mutate, { loading }] = useMutation(BLOCK_CREATE_UNIT);

  const createUnit = (options: MutationFunctionOptions) => {
    mutate({
      ...options,
      refetchQueries: [
        {
          query: BLOCK_GET_UNITS,
          variables: { zoning },
        },
      ],
      onCompleted: (data) => {
        options.onCompleted?.(data);
        toast({
          title: 'Success',
          description: 'Unit created successfully',
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

  return { createUnit, loading };
};
