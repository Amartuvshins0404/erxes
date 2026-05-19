import { gql } from '@apollo/client';

export const GET_BLOCK_CONTRACT_STATUSES = gql`
  query getBlockContractStatuses($projectId: String!) {
    getBlockContractStatuses(projectId: $projectId) {
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
