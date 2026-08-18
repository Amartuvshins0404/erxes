import { BLOCK_TRANSFER_UNIT } from '@/unit/graphql/unitMutations';
import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { BLOCK_GET_UNIT } from '../graphql/unitQueries';

export const useUnitTransfer = ({ unitId }: { unitId: string }) => {
  const [mutate, { loading }] = useMutation(BLOCK_TRANSFER_UNIT);

  const transferUnit = ({
    agencyId,
    agencySubdomain,
  }: {
    agencyId: string;
    agencySubdomain: string;
  }) => {
    return mutate({
      variables: {
        input: { unitId, agencyId, agencySubdomain },
      },
      refetchQueries: [{ query: BLOCK_GET_UNIT, variables: { id: unitId } }],
      onCompleted: () => {
        toast({ title: 'Success', description: 'Unit transferred to agency' });
      },
      onError: (err) => {
        toast({
          title: 'Transfer failed',
          description: err.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { transferUnit, loading };
};
