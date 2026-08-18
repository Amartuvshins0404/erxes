import { gql } from '@apollo/client';

export const GET_BLOCK_STATUSES = gql`
  query getBlockOpptyStatuses($projectId: String!) {
    getBlockOpptyStatuses(projectId: $projectId) {
      _id
      name
      projectId
      description
      color
      order
      type
      createdAt
      updatedAt
    }
  }
`;
