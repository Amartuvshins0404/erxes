import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertDialog,
  Form,
  Input,
  Spinner,
  Textarea,
  useQueryState,
  useToast,
} from 'erxes-ui';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEventDetail } from '@/events/hooks/useEventDetail';
import { useSendEventInvitations } from '@/events/hooks/useSendEventInvitations';
import { formatDateTime } from '~/lib/datetime';

const sendInvitationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().optional(),
});

type SendInvitationValues = z.infer<typeof sendInvitationSchema>;

/**
 * Opened from the row's more menu, so the event is already known — there is no
 * event picker. Recipients are every client portal user, matching the content
 * plugin's send-notification behaviour.
 */
export const SendInvitationDialog = () => {
  const [inviteEventId, setInviteEventId] =
    useQueryState<string>('inviteEventId');
  const { toast } = useToast();
  const { event, loading } = useEventDetail(inviteEventId);
  const { sendEventInvitations, loading: sending } = useSendEventInvitations();

  const form = useForm<SendInvitationValues>({
    resolver: zodResolver(sendInvitationSchema),
    defaultValues: { title: '', message: '' },
  });

  const { reset } = form;

  useEffect(() => {
    if (!event) {
      return;
    }

    reset({
      title: event.name ?? '',
      message: event?.description || '',
    });
  }, [event, reset]);

  const close = () => setInviteEventId(null);

  const onSubmit = async (values: SendInvitationValues) => {
    if (!inviteEventId) {
      return;
    }

    try {
      const result = await sendEventInvitations(inviteEventId, {
        title: values.title,
        message: values.message,
      });

      const recipientCount = result?.recipientCount ?? 0;

      if (recipientCount === 0) {
        toast({
          title: 'No recipients',
          description: 'No client portal users were found.',
          variant: 'warning',
        });
        return;
      }

      toast({
        title: 'Invitations sent',
        variant: 'success',
        description: `Notified ${recipientCount} member${
          recipientCount > 1 ? 's' : ''
        }.`,
      });

      close();
    } catch (error) {
      toast({
        title: 'Could not send invitations',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog open={!!inviteEventId}>
      <AlertDialog.Content>
        <Form {...form}>
          <AlertDialog.Header>
            <AlertDialog.Title>Send invitation</AlertDialog.Title>
            <AlertDialog.Description>
              Invites all client portal users to this event.
            </AlertDialog.Description>
          </AlertDialog.Header>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {loading ? (
              <Spinner containerClassName="py-6" />
            ) : (
              <>
                <Form.Field
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Title</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Message</Form.Label>
                      <Form.Control>
                        <Textarea rows={4} {...field} />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </>
            )}

            <AlertDialog.Footer>
              <AlertDialog.Cancel type="button" onClick={close}>
                Cancel
              </AlertDialog.Cancel>
              <AlertDialog.Action
                type="submit"
                disabled={sending || loading || !event}
              >
                {sending ? <Spinner containerClassName="flex-none" /> : null}
                Send invitation
              </AlertDialog.Action>
            </AlertDialog.Footer>
          </form>
        </Form>
      </AlertDialog.Content>
    </AlertDialog>
  );
};
