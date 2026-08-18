import { InfoCard, InfoCardContent } from '@/block/components/card';
import { useDeveloperInfo } from '@/block/hooks/useDeveloperInfo';
import { useUpdateDeveloperVerificationStatus } from '@/block/hooks/useUpdateDeveloperVerificationStatus';
import { Badge, Button, Spinner, toast } from 'erxes-ui';

const VERIFICATION_STATUS_META: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'secondary' }
> = {
  verified: { label: 'Verified', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  unverified: { label: 'Unverified', variant: 'secondary' },
};

export const BlockDeveloperVerification = () => {
  const { developerInfo, loading } = useDeveloperInfo();

  if (loading) return <Spinner containerClassName="py-32" />;

  return (
    <div className="p-6 mx-auto w-full max-w-lg flex flex-col gap-6">
      <h1 className="text-lg font-bold">Verification</h1>
      {developerInfo && (
        <BlockDeveloperVerificationContent
          verificationStatus={developerInfo.verificationStatus}
        />
      )}
    </div>
  );
};

const BlockDeveloperVerificationContent = ({
  verificationStatus,
}: {
  verificationStatus: string;
}) => {
  const { updateDeveloperVerificationStatus, loading } =
    useUpdateDeveloperVerificationStatus();

  const status =
    VERIFICATION_STATUS_META[verificationStatus] ||
    VERIFICATION_STATUS_META.unverified;
  const canRequest = verificationStatus === 'unverified';

  const onRequestVerification = () => {
    updateDeveloperVerificationStatus({
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Verification request sent',
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

  return (
    <InfoCard
      title="Verification Status"
      description="Verify your developer profile to build trust with buyers"
    >
      <InfoCardContent className="gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-accent-foreground">Status</span>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <Button
          onClick={onRequestVerification}
          disabled={!canRequest || loading}
          className="w-full"
        >
          {verificationStatus === 'verified'
            ? 'Already verified'
            : verificationStatus === 'pending'
              ? 'Verification request pending'
              : 'Request Verification'}
        </Button>
      </InfoCardContent>
    </InfoCard>
  );
};
