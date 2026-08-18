import { gql } from '@apollo/client';

export const CREATE_OFFER = gql`
  mutation BlockCreateOffer($input: BlockOfferInput!) {
    blockCreateOffer(input: $input) {
      _id
    }
  }
`;

export const UPDATE_OFFER = gql`
  mutation BlockUpdateOffer($id: String!, $input: BlockOfferInput!) {
    blockUpdateOffer(_id: $id, input: $input) {
      _id
    }
  }
`;

export const SEND_OFFER_EMAIL = gql`
  mutation BlockSendOfferEmail($id: String!) {
    blockSendOfferEmail(_id: $id) {
      _id
      status
    }
  }
`;

export const MANUAL_SYNC_OFFER = gql`
  mutation BlockManualSyncOffer($offerId: String!) {
    blockManualSyncOffer(offerId: $offerId) {
      _id
      status
    }
  }
`;
