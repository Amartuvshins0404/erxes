import { gql } from '@apollo/client';

export const CREATE_BLOCK_CONTRACT_STATUS = gql`
  mutation createBlockContractStatus($input: BlockContractStatusInput!) {
    createBlockContractStatus(input: $input) {
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
