import { Badge, cn, Empty, Spinner } from 'erxes-ui';
import { IconSparkles } from '@tabler/icons-react';
import { AgencyDashboard } from './AgencyDashboard';
import { AgencyVerificationWindow } from './AgencyVerificationWindow';
import { useVerificationStatus } from '../hooks/useVerificationStatus';
import {
  PENDING_INSTRUCTIONS,
  REJECTION_INSTRUCTIONS,
} from '../constants/dashboard';

export const AgencyDashboardWindow = () => {
  const { verificationInfo, loading } = useVerificationStatus();
  const { verificationStatus, rejectionReasons, rejectionNotes } =
    verificationInfo || {};

  if (loading) {
    return <Spinner containerClassName="py-32" />;
  }
  return (
    <div className="flex flex-col gap-6 p-8">
      <div
        className={cn('relative rounded-xl flex flex-col overflow-hidden', {
          'p-4': verificationStatus !== 'verified',
        })}
      >
        {verificationStatus !== 'verified' && (
          <div className="blk:backdrop-blur-lg absolute inset-0 h-full w-full z-10 flex items-center justify-center">
            <Empty>
              <Empty.Header>
                <Empty.Media variant="icon">
                  <IconSparkles className="text-primary" />
                </Empty.Media>
                <Empty.Title>
                  <Badge
                    variant={
                      verificationStatus === 'pending'
                        ? 'warning'
                        : 'destructive'
                    }
                  >
                    {verificationStatus === 'pending' ? 'Pending' : 'Rejected'}
                  </Badge>
                </Empty.Title>
                <Empty.Description>
                  We are currently reviewing your agency information. Dashboard
                  will be unavialable until verification is complete
                </Empty.Description>
              </Empty.Header>
              <Empty.Content>
                <ul className="list-disc list-inside text-xs text-muted-foreground text-left">
                  {verificationStatus === 'unverified'
                    ? REJECTION_INSTRUCTIONS.map((ins, ind) => (
                        <li key={ind}>{ins}</li>
                      ))
                    : PENDING_INSTRUCTIONS.map((ins, ind) => (
                        <li key={ind}>{ins}</li>
                      ))}
                </ul>
              </Empty.Content>
            </Empty>
          </div>
        )}
        <AgencyDashboard />
      </div>
      <AgencyVerificationWindow
        rejectionNotes={rejectionNotes}
        rejectionReasons={rejectionReasons}
        verificationStatus={verificationStatus}
      />
    </div>
  );
};
