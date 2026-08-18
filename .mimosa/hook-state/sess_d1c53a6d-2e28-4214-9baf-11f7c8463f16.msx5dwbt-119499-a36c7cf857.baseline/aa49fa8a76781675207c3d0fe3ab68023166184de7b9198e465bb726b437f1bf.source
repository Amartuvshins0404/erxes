import { gql } from '@apollo/client';

export const MUSHOP_RESYNC_ORDER = gql`
  mutation MushopResyncOrder($_id: String!) {
    mushopResyncOrder(_id: $_id) {
      _id
      status
      entityId
      error
    }
  }
`;
