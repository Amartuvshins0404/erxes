import { gql } from '@apollo/client';

export const COLLECTIVE_PACKAGE_FRAGMENT = gql`
  fragment CollectivePackageFields on CollectivePackage {
    _id
    name
    description
    coverImage
    collectiveId
    posToken
    productIds
    price
    status
    createdAt
    updatedAt
  }
`;

export const GET_COLLECTIVE_PACKAGES = gql`
  query CollectivePackages(
    $searchValue: String
    $status: String
    $cursor: String
    $limit: Int
  ) {
    collectivePackages(
      searchValue: $searchValue
      status: $status
      cursor: $cursor
      limit: $limit
    ) {
      list {
        ...CollectivePackageFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${COLLECTIVE_PACKAGE_FRAGMENT}
`;

export const GET_COLLECTIVE_PACKAGE_DETAIL = gql`
  query CollectivePackageDetail($_id: String!) {
    collectivePackageDetail(_id: $_id) {
      ...CollectivePackageFields
    }
  }
  ${COLLECTIVE_PACKAGE_FRAGMENT}
`;
