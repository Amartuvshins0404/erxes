import { Button, Dialog, Input, Spinner } from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { useApproveProvider } from '../hooks/useProviderMutations';
import { ONE_FIT_PROVIDER } from '../graphql/providerQueries';
import { useState, useEffect } from 'react';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';
import { useAtomValue } from 'jotai';
import { currentUserState } from 'ui-modules';

interface ApproveProviderDialogProps {
  providerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const ApproveProviderDialog = ({
  providerId,
  open,
  onOpenChange,
  onClose,
}: ApproveProviderDialogProps) => {
  const { data } = useQuery(ONE_FIT_PROVIDER, {
    variables: { _id: providerId },
    skip: !open,
  });

  const provider = data?.oneFitProvider;
  const currentUser = useAtomValue(currentUserState);
  const [approvedBy, setApprovedBy] = useState('');

  useEffect(() => {
    if (currentUser?._id && !approvedBy) {
      setApprovedBy(currentUser._id);
    }
  }, [currentUser?._id, approvedBy]);

  const { approveProvider, loading } = useApproveProvider();

  const handleApprove = () => {
    if (!approvedBy.trim()) {
      return;
    }

    approveProvider({
      variables: {
        _id: providerId,
        approvedBy: approvedBy.trim(),
      },
      onCompleted: () => {
        onClose();
        setApprovedBy('');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Approve Provider</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to approve{' '}
            <strong>
              {provider?.businessName
                ? getLocalizedString(provider.businessName, 'en')
                : 'this provider'}
            </strong>
            ? This action will change the provider status to approved.
          </Dialog.Description>
        </Dialog.Header>
        <div className="space-y-4 py-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Approved By (User ID) *
            </label>
            <Input
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
              placeholder="Enter user ID"
            />
          </div>
        </div>
        <Dialog.Footer>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApprove}
            disabled={loading || !approvedBy.trim()}
          >
            <Spinner show={loading} />
            Approve Provider
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};
