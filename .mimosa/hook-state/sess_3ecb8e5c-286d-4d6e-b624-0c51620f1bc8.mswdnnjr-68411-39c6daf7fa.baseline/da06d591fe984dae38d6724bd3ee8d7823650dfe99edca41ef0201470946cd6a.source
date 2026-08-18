import { gql } from '@apollo/client';

export const MUSHOP_UPDATE_PRODUCT_STATUS = gql`
  mutation MushopUpdateProductStatus($_id: String!, $status: String!, $note: String) {
    mushopUpdateProductStatus(_id: $_id, status: $status, note: $note) {
      _id
      status
    }
  }
`;

export const MUSHOP_BULK_UPDATE_PRODUCT_STATUS = gql`
  mutation MushopBulkUpdateProductStatus($ids: [String!]!, $status: String!) {
    mushopBulkUpdateProductStatus(ids: $ids, status: $status)
  }
`;

export const MUSHOP_BULK_REMOVE_PRODUCTS = gql`
  mutation MushopBulkRemoveProducts($ids: [String!]!) {
    mushopBulkRemoveProducts(ids: $ids)
  }
`;

export const MUSHOP_ASSIGN_PRODUCT_CATEGORY = gql`
  mutation MushopAssignProductCategory($_id: String!, $categoryId: String) {
    mushopAssignProductCategory(_id: $_id, categoryId: $categoryId) {
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
