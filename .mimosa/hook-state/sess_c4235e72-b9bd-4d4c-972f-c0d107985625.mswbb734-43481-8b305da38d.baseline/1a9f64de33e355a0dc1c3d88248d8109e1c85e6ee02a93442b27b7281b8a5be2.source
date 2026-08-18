import {
  Button,
  Dialog,
  Form,
  Input,
  Spinner,
  Checkbox,
  toast,
} from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOneFitCustomerMutations } from '../hooks/useOneFitCustomerMutations';

const updateBookingPreferencesSchema = z.object({
  preferredTimeSlots: z.string().optional(),
  preferredDays: z.string().optional(),
  notificationEnabled: z.boolean().optional(),
});

type UpdateBookingPreferencesFormData = z.infer<
  typeof updateBookingPreferencesSchema
>;

interface UpdateBookingPreferencesDialogProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpdateBookingPreferencesDialog = ({
  customerId,
  open,
  onOpenChange,
}: UpdateBookingPreferencesDialogProps) => {
  const form = useForm<UpdateBookingPreferencesFormData>({
    resolver: zodResolver(updateBookingPreferencesSchema),
    defaultValues: {
      preferredTimeSlots: '',
      preferredDays: '',
      notificationEnabled: false,
    },
  });

  const { handleUpdateBookingPreferences, updatingPreferences } =
    useOneFitCustomerMutations();

  const onSubmit = async (data: UpdateBookingPreferencesFormData) => {
    try {
      const preferences = {
        preferredTimeSlots: data.preferredTimeSlots
          ? data.preferredTimeSlots.split(',').map((s) => s.trim())
          : undefined,
        preferredDays: data.preferredDays
          ? data.preferredDays.split(',').map((s) => s.trim())
          : undefined,
        notificationEnabled: data.notificationEnabled,
      };

      await handleUpdateBookingPreferences(customerId, preferences);
      toast({
        title: 'Success',
        description: 'Booking preferences updated successfully',
      });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to update booking preferences',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Update Booking Preferences</Dialog.Title>
          <Dialog.Description>
            Update the customer's booking preferences and notification settings.
          </Dialog.Description>
        </Dialog.Header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <Form.Field
              control={form.control}
              name="preferredTimeSlots"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Preferred Time Slots (comma-separated)</Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      placeholder="e.g., 09:00, 14:00, 18:00"
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="preferredDays"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Preferred Days (comma-separated)</Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      placeholder="e.g., Monday, Wednesday, Friday"
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="notificationEnabled"
              render={({ field }) => (
                <Form.Item className="flex flex-row items-start space-x-3 space-y-0">
                  <Form.Control>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Form.Control>
                  <div className="space-y-1 leading-none">
                    <Form.Label>Enable Notifications</Form.Label>
                    <Form.Description>
                      Send notifications for booking reminders
                    </Form.Description>
                  </div>
                </Form.Item>
              )}
            />
            <Dialog.Footer>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updatingPreferences}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatingPreferences}>
                <Spinner show={updatingPreferences} />
                Update Preferences
              </Button>
            </Dialog.Footer>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

