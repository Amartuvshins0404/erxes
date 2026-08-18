import {
  Button,
  Dialog,
  Form,
  Input,
  Spinner,
  toast,
} from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@apollo/client';
import {
  ONE_FIT_MEMBERSHIP_HOLD_START,
} from '../graphql/onefitCustomerMutations';
import { ONE_FIT_CUSTOMER } from '../graphql/onefitCustomerQueries';

const startHoldSchema = z.object({
  holdDays: z
    .number()
    .int('Must be a whole number')
    .min(1, 'Hold days must be at least 1')
    .max(365, 'Hold days cannot exceed 365'),
});

type StartHoldFormData = z.infer<typeof startHoldSchema>;

interface StartMembershipHoldDialogProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function StartMembershipHoldDialog({
  customerId,
  open,
  onOpenChange,
  onSuccess,
}: StartMembershipHoldDialogProps) {
  const form = useForm<StartHoldFormData>({
    resolver: zodResolver(startHoldSchema),
    defaultValues: {
      holdDays: 7,
    },
  });

  const [startHold, { loading: startingHold }] = useMutation(
    ONE_FIT_MEMBERSHIP_HOLD_START,
    {
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Membership hold started.',
        });
        onOpenChange(false);
        form.reset({ holdDays: 7 });
        onSuccess?.();
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to start hold',
          variant: 'destructive',
        });
      },
      refetchQueries: [
        {
          query: ONE_FIT_CUSTOMER,
          variables: { _id: customerId },
        },
      ],
    },
  );

  const onSubmit = (data: StartHoldFormData) => {
    startHold({
      variables: {
        userId: customerId,
        holdDays: data.holdDays,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Start membership hold</Dialog.Title>
          <Dialog.Description>
            Pause this customer's membership. They can only hold once every 30
            days. Hold days may be limited by system config.
          </Dialog.Description>
        </Dialog.Header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <Form.Field
              control={form.control}
              name="holdDays"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Hold duration (days)</Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      max={365}
                      placeholder="e.g. 7"
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={startingHold}>
                {startingHold ? <Spinner className="size-4" /> : null}
                Start hold
              </Button>
            </div>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
}
