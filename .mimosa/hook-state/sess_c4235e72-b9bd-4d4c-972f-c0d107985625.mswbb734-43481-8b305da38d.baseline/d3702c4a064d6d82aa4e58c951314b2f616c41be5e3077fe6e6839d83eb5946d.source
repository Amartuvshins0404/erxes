import { Button, Dialog, Spinner } from 'erxes-ui';
import { useMarkAttendance } from '../hooks/useBookingMutations';
import { AttendanceStatus } from '../types/booking';

interface MarkAttendanceDialogProps {
  bookingId: string;
  /** When true, only "attended" is offered (correct a recorded no-show). */
  noShowOverride?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const MarkAttendanceDialog = ({
  bookingId,
  noShowOverride = false,
  open,
  onOpenChange,
  onClose,
}: MarkAttendanceDialogProps) => {
  const { markAttendance, loading } = useMarkAttendance();

  const handleMarkAttendance = (status: AttendanceStatus) => {
    markAttendance(bookingId, status);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>
            {noShowOverride ? 'Mark attended' : 'Mark attendance'}
          </Dialog.Title>
          <Dialog.Description>
            {noShowOverride
              ? 'This booking is no-show. Mark attended if the member actually came so the visit is completed.'
              : 'Select the attendance status for this booking.'}
          </Dialog.Description>
        </Dialog.Header>
        <div className="flex flex-col gap-4 py-4">
          <Button
            variant="default"
            onClick={() => handleMarkAttendance(AttendanceStatus.ATTENDED)}
            disabled={loading}
            className="w-full"
          >
            <Spinner show={loading} />
            Mark as attended
          </Button>
          {!noShowOverride ? (
            <Button
              variant="destructive"
              onClick={() => handleMarkAttendance(AttendanceStatus.NO_SHOW)}
              disabled={loading}
              className="w-full"
            >
              <Spinner show={loading} />
              Mark as no show
            </Button>
          ) : null}
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
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

