import { Badge, Spinner } from 'erxes-ui';
import { useInView } from 'react-intersection-observer';
import { CustomersInline, ICustomer } from 'ui-modules';
import { useEventInvitations } from '@/events/hooks/useEventInvitations';
import { ATTENDANCE_LABELS } from '~/lib/constants';
import { formatDateTime } from '~/lib/datetime';
import { InvitationStatus } from '~/types/event';

const STATUS_VARIANT: Record<
  InvitationStatus,
  'success' | 'warning' | 'destructive' | 'secondary'
> = {
  going: 'success',
  maybe: 'warning',
  declined: 'destructive',
  pending: 'secondary',
};

export const AttendanceList = ({
  eventId,
  status,
}: {
  eventId: string;
  status?: InvitationStatus;
}) => {
  const { invitations, hasMore, loading, fetchingMore, handleFetchMore } =
    useEventInvitations(eventId, status);

  const { ref: sentinelRef } = useInView({
    onChange: (inView) => {
      if (inView) {
        handleFetchMore();
      }
    },
  });

  if (loading && invitations.length === 0) {
    return <Spinner containerClassName="py-6" />;
  }

  if (invitations.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {status
          ? `No ${ATTENDANCE_LABELS[status].toLowerCase()} responses.`
          : 'No responses yet.'}
      </p>
    );
  }

  return (
    <ul className="flex max-h-96 flex-col divide-y divide-border overflow-y-auto rounded-lg border">
      {invitations.map((invitation) => (
        <li
          key={invitation._id}
          className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-accent/40"
        >
          <CustomersInline
            customerIds={[invitation.customerId]}
            customers={
              invitation.customer
                ? [invitation.customer as ICustomer]
                : undefined
            }
            placeholder="Unknown customer"
            className="min-w-0 flex-auto"
          />

          <Badge variant={STATUS_VARIANT[invitation.status]} className="flex-none">
            {ATTENDANCE_LABELS[invitation.status]}
          </Badge>

          <span className="flex-none text-xs text-muted-foreground">
            {formatDateTime(invitation.respondedAt ?? invitation.createdAt)}
          </span>
        </li>
      ))}

      {hasMore && (
        <li ref={sentinelRef} className="flex justify-center py-3">
          {fetchingMore && <Spinner containerClassName="flex-none" />}
        </li>
      )}
    </ul>
  );
};
