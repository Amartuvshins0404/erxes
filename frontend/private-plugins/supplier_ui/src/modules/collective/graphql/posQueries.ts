import { gql } from '@apollo/client';

export const GET_POSCLIENT_CONFIGS = gql`
  query PosclientConfigs {
    posclientConfigs {
      _id
      name
      token
    }
  }
`;

export const GET_POSC_PRODUCTS = gql`
  query PoscProducts(
    $searchValue: String
    $categoryId: String
    $page: Int
    $perPage: Int
  ) {
    poscProducts(
      searchValue: $searchValue
      categoryId: $categoryId
      page: $page
      perPage: $perPage
    ) {
      _id
      name
      code
      unitPrice
      categoryId
      attachment {
        url
      }
    }
  }
`;
