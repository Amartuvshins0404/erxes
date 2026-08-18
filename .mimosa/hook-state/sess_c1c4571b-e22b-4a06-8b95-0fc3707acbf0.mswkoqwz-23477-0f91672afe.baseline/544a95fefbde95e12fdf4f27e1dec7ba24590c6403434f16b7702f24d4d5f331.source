import { Button, Dialog, Spinner, Textarea } from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { useRejectProvider } from '../hooks/useProviderMutations';
import { ONE_FIT_PROVIDER } from '../graphql/providerQueries';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from 'erxes-ui';
import { SelectOneFitCustomer } from '~/modules/onefitCustomer/components/SelectOneFitCustomer';

const rejectProviderSchema = z.object({
  rejectionReason: z
    .string()
    .min(1, { message: 'Rejection reason is required' }),
  rejectedBy: z.string().min(1, { message: 'Rejected by is required' }),
});

type RejectProviderFormData = z.infer<typeof rejectProviderSchema>;

interface RejectProviderDialogProps {
  providerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const RejectProviderDialog = ({
  providerId,
  open,
  onOpenChange,
  onClose,
}: RejectProviderDialogProps) => {
  const { data } = useQuery(ONE_FIT_PROVIDER, {
    variables: { _id: providerId },
    skip: !open,
  });

  const provider = data?.oneFitProvider;

  const form = useForm<RejectProviderFormData>({
    resolver: zodResolver(rejectProviderSchema),
    defaultValues: {
      rejectionReason: '',
      rejectedBy: '',
    },
  });

  const { rejectProvider, loading } = useRejectProvider();

  const onSubmit = (data: RejectProviderFormData) => {
    rejectProvider({
      variables: {
        _id: providerId,
        rejectionReason: data.rejectionReason,
        rejectedBy: data.rejectedBy,
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
          <Dialog.Title>Reject Provider</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to reject{' '}
            <strong>{provider?.businessName.mn}</strong>? Please provide a
            reason for rejection.
          </Dialog.Description>
        </Dialog.Header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <Form.Field
              control={form.control}
              name="rejectionReason"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Rejection Reason *</Form.Label>
                  <Form.Control>
                    <Textarea
                      {...field}
                      placeholder="Enter rejection reason"
                      rows={4}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="rejectedBy"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Rejected By *</Form.Label>
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
            <Dialog.Footer>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Spinner show={loading} />
                Reject Provider
              </Button>
            </Dialog.Footer>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};
