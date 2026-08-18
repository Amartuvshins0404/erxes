import { useMutation } from '@apollo/client';
import { EVENT_INVITATIONS_SEND } from '@/events/graphql/sendInvitationsMutation';

type SendInvitationsResult = {
  recipientCount: number;
  invitedCount: number;
};

export const useSendEventInvitations = () => {
  const [sendInvitations, { loading }] = useMutation<
    { eventInvitationsSend: SendInvitationsResult },
    { _id: string; title?: string; message?: string }
  >(EVENT_INVITATIONS_SEND, {
    // The attendance columns gain a denominator the moment invitations land.
    refetchQueries: ['Events', 'EventAttendanceSummary', 'EventInvitations'],
  });

  const sendEventInvitations = async (
    eventId: string,
    { title, message }: { title?: string; message?: string } = {},
  ) => {
    const result = await sendInvitations({
      variables: { _id: eventId, title, message },
    });

    return result.data?.eventInvitationsSend;
  };

  return { sendEventInvitations, loading };
};
