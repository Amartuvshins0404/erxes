import { gql } from '@apollo/client';

export const UPDATE_BLOCK_STATUS = gql`
  mutation updateBlockOpptyStatus($_id: String!, $input: BlockOpptyStatusInput!) {
    updateBlockOpptyStatus(_id: $_id, input: $input) {
      _id
      name
      projectId
      description
      color
      order
      type
    }
  }
`;
