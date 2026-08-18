import { useMutation } from '@apollo/client';
import { ADMIN_REJECT_AGENCY } from '../graphql';
import { toast, useConfirm } from 'erxes-ui';
import { AgencyRejectionReasons } from '../types/agencyTypes';

type THandleReject = (
  id: string,
  reasons: AgencyRejectionReasons[],
  notes?: string,
) => void;

export const useAgencyReject = () => {
  const { confirm } = useConfirm();
  const [mutate, { loading, error }] = useMutation(ADMIN_REJECT_AGENCY, {
    onCompleted: () => {
      toast({
        variant: 'success',
        title: 'Agency updated successfully!',
      });
    },
    onError: (err) => {
      toast({
        variant: 'destructive',
        title: 'Failed to reject agency',
        description: err.message,
      });
    },
    refetchQueries: ['GetAgencies', 'GetAgencyInfo'],
  });

  const handleReject: THandleReject = (id, reasons, notes) => {
    confirm({
      message: 'Are you sure you want to reject submission?',
    }).then(async () => {
      const reasonKeys = reasons.map(
        (reason) =>
          Object.keys(AgencyRejectionReasons).find(
            (key) =>
              AgencyRejectionReasons[
                key as keyof typeof AgencyRejectionReasons
              ] === reason,
          ) as string,
      );
      await mutate({
        variables: {
          agencyId: id,
          input: {
            reasons: reasonKeys,
            notes: notes,
          },
        },
      });
    });
  };

  return {
    handleReject,
    loading,
    error,
  };
};
