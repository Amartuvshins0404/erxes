import { BLOCK_UPDATE_UNIT } from '@/unit/graphql/unitMutations';
import { IUnit } from '@/unit/types/unitType';
import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { Except } from 'type-fest';
import { BLOCK_GET_UNITS } from '../graphql/unitQueries';

export const useUnitUpdate = ({
  id,
  zoning,
}: {
  id: string;
  zoning: string;
}) => {
  const [mutate] = useMutation(BLOCK_UPDATE_UNIT);
  const updateUnit = (
    input: Except<Partial<IUnit>, '_id' | 'type'> & { type?: string },
  ) => {
    mutate({
      variables: { id, input },
      refetchQueries: [{ query: BLOCK_GET_UNITS, variables: { zoning } }],
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Unit updated successfully',
        });
      },
    });
  };
  return { updateUnit };
};
