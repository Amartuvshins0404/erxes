import { Button, Dialog, Form, Input, Spinner, Textarea } from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCancelBooking } from '../hooks/useBookingMutations';

const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

type CancelBookingFormData = z.infer<typeof cancelBookingSchema>;

interface CancelBookingDialogProps {
  bookingId: string;
  /** No-show cancellation refunds credits like a normal staff cancel. */
  isNoShowBooking?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const CancelBookingDialog = ({
  bookingId,
  isNoShowBooking = false,
  open,
  onOpenChange,
  onClose,
}: CancelBookingDialogProps) => {
  const form = useForm<CancelBookingFormData>({
    resolver: zodResolver(cancelBookingSchema),
    defaultValues: {
      reason: '',
    },
  });
  const { cancelBooking, loading } = useCancelBooking();

  const onSubmit = (data: CancelBookingFormData) => {
    cancelBooking({
      variables: {
        _id: bookingId,
        reason: data.reason || undefined,
      },
      onCompleted: () => {
        onClose();
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Cancel Booking</Dialog.Title>
          <Dialog.Description>
            {isNoShowBooking
              ? 'Cancel this no-show booking and refund credits to the member. This cannot be undone.'
              : 'Are you sure you want to cancel this booking? This action cannot be undone. Cancellation must be made at least 24 hours in advance.'}
          </Dialog.Description>
        </Dialog.Header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <Form.Field
              control={form.control}
              name="reason"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Reason (Optional)</Form.Label>
                  <Form.Control>
                    <Textarea
                      {...field}
                      placeholder="Enter cancellation reason"
                      rows={4}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Dialog.Footer>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={loading}>
                <Spinner show={loading} />
                Confirm Cancellation
              </Button>
            </Dialog.Footer>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

