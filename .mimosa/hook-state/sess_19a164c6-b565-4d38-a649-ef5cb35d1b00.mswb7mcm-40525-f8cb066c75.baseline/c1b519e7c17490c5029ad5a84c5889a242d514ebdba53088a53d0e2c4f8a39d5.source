import { Badge, Button, Dialog } from 'erxes-ui';
import { BookingStatus, OneFitBooking } from '../types/booking';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';
import { OneFitCustomersInline } from '~/modules/onefitCustomer/components/OneFitCustomersInline';
import { format, parseISO } from 'date-fns';

interface BookingDetailDialogProps {
  booking: OneFitBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getStatusBadgeVariant(
  status: BookingStatus,
): 'success' | 'destructive' | 'info' | 'warning' | 'secondary' {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return 'success';
    case BookingStatus.CANCELLED:
      return 'destructive';
    case BookingStatus.COMPLETED:
      return 'info';
    case BookingStatus.NO_SHOW:
      return 'warning';
    default:
      return 'secondary';
  }
}

function getStatusLabel(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return 'Confirmed';
    case BookingStatus.CANCELLED:
      return 'Cancelled';
    case BookingStatus.COMPLETED:
      return 'Completed';
    case BookingStatus.NO_SHOW:
      return 'No Show';
    default:
      return status ?? '—';
  }
}

function getAttendanceBadgeVariant(
  status: string,
): 'success' | 'destructive' | 'info' | 'warning' | 'secondary' {
  switch (status) {
    case 'attended':
      return 'success';
    case 'no_show':
      return 'warning';
    case 'pending':
    default:
      return 'secondary';
  }
}

export function BookingDetailDialog({
  booking,
  open,
  onOpenChange,
}: BookingDetailDialogProps) {
  if (!booking || !open) {
    return null;
  }

  const bookingDate =
    typeof booking.bookingDate === 'string'
      ? parseISO(booking.bookingDate)
      : new Date(booking.bookingDate);
  const providerName = booking.provider
    ? getLocalizedString(booking.provider.businessName)
    : '—';
  const activityTypeName = booking.activityType
    ? getLocalizedString(booking.activityType.name)
    : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-md">
        <Dialog.Header>
          <Dialog.Title>Booking details</Dialog.Title>
          <Dialog.Description>
            {format(bookingDate, 'PPP')} · {booking.startTime}–{booking.endTime}
          </Dialog.Description>
        </Dialog.Header>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-3 text-sm">
            <div>
              <span className="text-muted-foreground font-medium">
                Customer:
              </span>
              <div className="mt-1">
                {booking.user ? (
                  <OneFitCustomersInline
                    customers={[
                      {
                        _id: booking.user._id,
                        firstName: booking.user.firstName,
                        lastName: booking.user.lastName,
                        primaryEmail: booking.user.primaryEmail,
                        primaryPhone: booking.user.primaryPhone,
                        createdAt: '',
                        updatedAt: '',
                      },
                    ]}
                    placeholder="Unnamed customer"
                  />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground font-medium">
                Provider:
              </span>
              <div className="mt-1 font-medium">{providerName}</div>
            </div>

            <div>
              <span className="text-muted-foreground font-medium">
                Activity type:
              </span>
              <div className="mt-1 font-medium">{activityTypeName}</div>
            </div>

            <div>
              <span className="text-muted-foreground font-medium">Date:</span>
              <div className="mt-1 font-medium">
                {format(bookingDate, 'PPP')} {booking.startTime}–
                {booking.endTime}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground font-medium">
                Credit cost:
              </span>
              <div className="mt-1 font-medium">{booking.creditCost}</div>
            </div>

            <div>
              <span className="text-muted-foreground font-medium">Status:</span>
              <div className="mt-1">
                <Badge variant={getStatusBadgeVariant(booking.status)}>
                  {getStatusLabel(booking.status)}
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground font-medium">
                Attendance:
              </span>
              <div className="mt-1">
                <Badge
                  variant={getAttendanceBadgeVariant(booking.attendanceStatus)}
                >
                  {booking.attendanceStatus === 'attended'
                    ? 'Attended'
                    : booking.attendanceStatus === 'no_show'
                      ? 'No Show'
                      : 'Pending'}
                </Badge>
              </div>
            </div>

            {booking.status === 'cancelled' &&
              (booking.cancellationReason || booking.cancelledAt) && (
                <div>
                  <span className="text-muted-foreground font-medium">
                    Cancellation:
                  </span>
                  <div className="mt-1 text-muted-foreground text-xs">
                    {booking.cancellationReason && (
                      <p>{booking.cancellationReason}</p>
                    )}
                    {booking.cancelledAt && (
                      <p>
                        Cancelled at{' '}
                        {format(
                          typeof booking.cancelledAt === 'string'
                            ? parseISO(booking.cancelledAt)
                            : new Date(booking.cancelledAt),
                          'PPp',
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

        <Dialog.Footer>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
