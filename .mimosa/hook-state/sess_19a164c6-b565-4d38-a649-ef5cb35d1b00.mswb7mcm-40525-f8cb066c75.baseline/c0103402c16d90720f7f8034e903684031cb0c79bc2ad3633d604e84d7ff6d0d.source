import { Button, Dialog, Form, Input, Select, Spinner } from 'erxes-ui';
import { IconPlus } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { currentUserState } from 'ui-modules';
import { useQuery } from '@apollo/client';
import { useCreateBooking } from '../hooks/useBookingMutations';
import { ONE_FIT_ACTIVITY_TYPES } from '~/modules/activity-type/graphql/activityTypeQueries';
import { SelectOneFitCustomer } from '~/modules/onefitCustomer/components/SelectOneFitCustomer';
import { SelectProviderSearchable } from '~/modules/provider/components/SelectProviderSearchable';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';

const createBookingSchema = z.object({
  userId: z.string().min(1, { message: 'User is required' }),
  providerId: z.string().min(1, { message: 'Provider is required' }),
  activityTypeId: z.string().min(1, { message: 'Activity Type is required' }),
  bookingDate: z.string().min(1, { message: 'Booking date is required' }),
  startTime: z.string().min(1, { message: 'Start time is required' }),
  endTime: z.string().min(1, { message: 'End time is required' }),
});

type CreateBookingFormData = z.infer<typeof createBookingSchema>;

export const CreateBookingDialog = () => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>
          <IconPlus />
          Create Booking
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Create Booking</Dialog.Title>
        </Dialog.Header>
        <CreateBookingForm onClose={() => setOpen(false)} />
      </Dialog.Content>
    </Dialog>
  );
};

const CreateBookingForm = ({ onClose }: { onClose: () => void }) => {
  const currentUser = useAtomValue(currentUserState);
  const form = useForm<CreateBookingFormData>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      userId: currentUser?._id || '',
      providerId: '',
      activityTypeId: '',
      bookingDate: '',
      startTime: '',
      endTime: '',
    },
  });

  const providerId = form.watch('providerId');

  const { data: activityTypesData } = useQuery(ONE_FIT_ACTIVITY_TYPES, {
    variables: {
      isActive: true,
      providerId: providerId || undefined,
    },
    skip: !providerId,
  });

  const activityTypes = activityTypesData?.oneFitActivityTypes?.list || [];

  const { createBooking, loading } = useCreateBooking();

  const onSubmit = (data: CreateBookingFormData) => {
    createBooking({
      variables: {
        userId: data.userId,
        activityTypeId: data.activityTypeId,
        bookingDate: new Date(data.bookingDate),
        startTime: data.startTime,
        endTime: data.endTime,
      },
      onCompleted: () => {
        onClose();
        form.reset();
      },
    });
  };

  const handleProviderChange = (value: string) => {
    form.setValue('providerId', value);
    form.setValue('activityTypeId', '');
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <Form.Field
          control={form.control}
          name="userId"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>User</Form.Label>
              <Form.Control>
                <SelectOneFitCustomer.FormItem
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="providerId"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Provider</Form.Label>
              <Form.Control>
                <SelectProviderSearchable.FormItem
                  value={field.value}
                  onValueChange={handleProviderChange}
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="activityTypeId"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Activity Type</Form.Label>
              <Form.Control>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!providerId}
                >
                  <Select.Trigger>
                    <Select.Value
                      placeholder={
                        providerId
                          ? 'Select activity type'
                          : 'Select provider first'
                      }
                    />
                  </Select.Trigger>
                  <Select.Content>
                    {activityTypes.map((activityType) => (
                      <Select.Item
                        key={activityType._id}
                        value={activityType._id}
                      >
                        {getLocalizedString(activityType.name, 'en')} (
                        {activityType.creditCost} credits)
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="bookingDate"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Booking Date</Form.Label>
              <Form.Control>
                <Input
                  {...field}
                  type="date"
                  placeholder="Select booking date"
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Start Time</Form.Label>
              <Form.Control>
                <Input {...field} type="time" placeholder="HH:mm" />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="endTime"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>End Time</Form.Label>
              <Form.Control>
                <Input {...field} type="time" placeholder="HH:mm" />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Dialog.Footer>
          <Button type="submit" size="lg" disabled={loading}>
            <Spinner show={loading} />
            Create Booking
          </Button>
        </Dialog.Footer>
      </form>
    </Form>
  );
};
