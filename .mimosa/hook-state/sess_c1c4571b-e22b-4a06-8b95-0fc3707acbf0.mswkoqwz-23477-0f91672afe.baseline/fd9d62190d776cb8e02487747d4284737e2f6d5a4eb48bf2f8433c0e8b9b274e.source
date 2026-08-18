import { gql } from '@apollo/client';

export const BA_UPDATE_PRODUCT_STATUS = gql`
  mutation BaUpdateProductStatus(
    $_id: String!
    $status: String!
    $note: String
  ) {
    baUpdateProductStatus(_id: $_id, status: $status, note: $note) {
      _id
      status
    }
  }
`;

export const BA_ASSIGN_PRODUCT_CATEGORY = gql`
  mutation BaAssignProductCategory($_id: String!, $categoryId: String) {
    baAssignProductCategory(_id: $_id, categoryId: $categoryId) {
      _id
      categoryId
      category {
        _id
        name
        code
      }
    }
  }
`;

export const BA_REMOVE_PRODUCT = gql`
  mutation BaRemoveProduct($_id: String!) {
    baRemoveProduct(_id: $_id)
  }
`;
