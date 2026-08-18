import { useMutation } from '@apollo/client';
import { ADMIN_VERIFY_AGENCY } from '../graphql';
import { toast, useConfirm } from 'erxes-ui';

export const useAgencyVerify = () => {
  const { confirm } = useConfirm();
  const [mutate, { loading, error }] = useMutation(ADMIN_VERIFY_AGENCY, {
    onCompleted: () => {
      toast({ variant: 'success', title: 'Agency verified successfully' });
    },
    onError: (err) => {
      toast({
        variant: 'destructive',
        title: 'Failed to verify agency',
        description: err.message,
      });
    },
    refetchQueries: ['GetAgencies', 'GetAgencyInfo'],
  });

  const handleVerify = (id: string): void => {
    confirm({ message: 'Are you sure you want to verify?' }).then(async () => {
      await mutate({ variables: { agencyId: id } });
    });
  };

  return {
    handleVerify,
    error,
    loading,
  };
};
