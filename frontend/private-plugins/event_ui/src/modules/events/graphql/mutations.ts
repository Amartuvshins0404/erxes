import { gql } from '@apollo/client';

export const EVENTS_ADD = gql`
  mutation EventsAdd($doc: EventInput!) {
    eventsAdd(doc: $doc) {
      _id
      name
      status
    }
  }
`;

export const EVENTS_EDIT = gql`
  mutation EventsEdit($_id: String!, $doc: EventInput!) {
    eventsEdit(_id: $_id, doc: $doc) {
      _id
      name
      status
    }
  }
`;

export const EVENTS_REMOVE = gql`
  mutation EventsRemove($_ids: [String]!) {
    eventsRemove(_ids: $_ids)
  }
`;
