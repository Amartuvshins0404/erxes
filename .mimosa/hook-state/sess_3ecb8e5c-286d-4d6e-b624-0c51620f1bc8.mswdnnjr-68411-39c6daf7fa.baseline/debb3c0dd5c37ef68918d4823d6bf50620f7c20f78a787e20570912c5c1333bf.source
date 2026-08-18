import { gql } from '@apollo/client';

export const EVENT_INVITATIONS_SEND = gql`
  mutation EventInvitationsSend(
    $_id: String!
    $title: String
    $message: String
  ) {
    eventInvitationsSend(_id: $_id, title: $title, message: $message)
  }
`;
