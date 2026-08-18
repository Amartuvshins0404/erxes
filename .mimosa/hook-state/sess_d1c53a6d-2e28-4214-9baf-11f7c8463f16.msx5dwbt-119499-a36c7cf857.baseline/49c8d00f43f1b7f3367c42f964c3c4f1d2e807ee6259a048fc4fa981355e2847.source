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
import { useOneFitCustomerMutations } from '../hooks/useOneFitCustomerMutations';

const updateCreditBalanceSchema = z.object({
  balance: z.number().min(0, 'Balance must be 0 or greater'),
});

type UpdateCreditBalanceFormData = z.infer<typeof updateCreditBalanceSchema>;

interface UpdateCreditBalanceDialogProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpdateCreditBalanceDialog = ({
  customerId,
  open,
  onOpenChange,
}: UpdateCreditBalanceDialogProps) => {
  const form = useForm<UpdateCreditBalanceFormData>({
    resolver: zodResolver(updateCreditBalanceSchema),
    defaultValues: {
      balance: 0,
    },
  });

  const { handleUpdateCreditBalance, updatingCreditBalance } =
    useOneFitCustomerMutations();

  const onSubmit = async (data: UpdateCreditBalanceFormData) => {
    try {
      await handleUpdateCreditBalance(customerId, data.balance);
      toast({
        title: 'Success',
        description: 'Credit balance updated successfully',
      });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update credit balance',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Update Credit Balance</Dialog.Title>
          <Dialog.Description>
            Update the customer's current credit balance.
          </Dialog.Description>
        </Dialog.Header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <Form.Field
              control={form.control}
              name="balance"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Credit Balance</Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter credit balance"
                      onChange={(e) =>
                        field.onChange(Number.parseFloat(e.target.value) || 0)
                      }
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
                onClick={() => onOpenChange(false)}
                disabled={updatingCreditBalance}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatingCreditBalance}>
                <Spinner show={updatingCreditBalance} />
                Update Balance
              </Button>
            </Dialog.Footer>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  );
};

