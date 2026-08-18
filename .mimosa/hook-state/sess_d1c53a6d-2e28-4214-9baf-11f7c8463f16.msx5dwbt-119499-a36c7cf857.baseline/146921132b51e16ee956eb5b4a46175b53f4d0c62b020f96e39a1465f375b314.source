import { BLOCK_UPDATE_UNIT_TYPE } from '@/unit/graphql/unitMutations';
import { IUnitType } from '@/unit/types/unitType';
import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';

export const useUnitTypeUpdate = ({ id }: { id: string }) => {
  const [mutate, { loading }] = useMutation(BLOCK_UPDATE_UNIT_TYPE);
  const updateUnitType = (input: Partial<IUnitType>) => {
    mutate({
      variables: { id, input },
      update: (cache, { data }) => {
        if (!data) return;

        cache.modify({
          id: cache.identify(data.blockUpdateUnitType),
          fields: Object.keys(input).reduce(
            (fields: Record<string, () => any>, field) => {
              fields[field] = () => input[field as keyof IUnitType];
              return fields;
            },
            {},
          ),
          optimistic: true,
        });
      },
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Unit type updated successfully',
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
  return { updateUnitType, loading };
};
