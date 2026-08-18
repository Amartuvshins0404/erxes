import { MutationFunctionOptions, useMutation } from '@apollo/client';
import {
  BLOCK_CREATE_UNIT,
  BLOCK_CREATE_UNITS,
} from '@/unit/graphql/unitMutations';
import { BLOCK_GET_UNITS } from '@/unit/graphql/unitQueries';
import { toast } from 'erxes-ui';

export const useUnitCreate = ({ zoning }: { zoning: string }) => {
  const [mutate, { loading }] = useMutation(BLOCK_CREATE_UNIT);
  const [mutateUnits] = useMutation(BLOCK_CREATE_UNITS);

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

  const createUnits = (options: MutationFunctionOptions) => {
    mutateUnits({
      ...options,
      refetchQueries: [BLOCK_GET_UNITS],
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

  return { createUnit, createUnits, loading };
};
