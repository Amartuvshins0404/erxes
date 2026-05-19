import { gql } from '@apollo/client';

export const UPDATE_BLOCK_CONTRACT_STATUS = gql`
  mutation updateBlockContractStatus(
    $_id: String!
    $input: BlockContractStatusInput!
  ) {
    updateBlockContractStatus(_id: $_id, input: $input) {
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
