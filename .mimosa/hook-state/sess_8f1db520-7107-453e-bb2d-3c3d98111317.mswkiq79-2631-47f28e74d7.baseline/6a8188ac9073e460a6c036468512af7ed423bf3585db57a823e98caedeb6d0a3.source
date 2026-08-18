import { gql } from '@apollo/client';

export const BLOCK_GET_DOCUMENTS = gql`
  query BlockGetDocuments($itemType: String!, $itemId: String!) {
    blockGetDocuments(itemType: $itemType, itemId: $itemId) {
      _id
      name
      type
      itemType
      itemId
      visibility
      attachment
      description
      createdBy
      createdAt
      updatedAt
    }
  }
`;

export const BLOCK_CREATE_DOCUMENT = gql`
  mutation BlockCreateDocument($input: BlockDocumentInput!) {
    blockCreateDocument(input: $input) {
      _id
      name
      type
      itemType
      itemId
      visibility
      attachment
      description
      createdBy
    }
  }
`;

export const BLOCK_UPDATE_DOCUMENT = gql`
  mutation BlockUpdateDocument($_id: String!, $input: BlockDocumentInput!) {
    blockUpdateDocument(_id: $_id, input: $input) {
      _id
      name
      type
      visibility
    }
  }
`;

export const BLOCK_DELETE_DOCUMENT = gql`
  mutation BlockDeleteDocument($_id: String!) {
    blockDeleteDocument(_id: $_id) {
      _id
    }
  }
`;
