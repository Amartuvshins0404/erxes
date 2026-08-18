import { gql } from '@apollo/client';
import { COLLECTIVE_PACKAGE_FRAGMENT } from './packageQueries';

export const ADD_COLLECTIVE_PACKAGE = gql`
  mutation CollectivePackageAdd($input: CollectivePackageInput!) {
    collectivePackageAdd(input: $input) {
      ...CollectivePackageFields
    }
  }
  ${COLLECTIVE_PACKAGE_FRAGMENT}
`;

export const EDIT_COLLECTIVE_PACKAGE_STATUS = gql`
  mutation CollectivePackageEditStatus($_id: String!, $status: String!) {
    collectivePackageEditStatus(_id: $_id, status: $status) {
      ...CollectivePackageFields
    }
  }
  ${COLLECTIVE_PACKAGE_FRAGMENT}
`;

export const EDIT_COLLECTIVE_PACKAGE = gql`
  mutation CollectivePackageEdit(
    $_id: String!
    $name: String
    $description: String
    $coverImage: String
    $price: Float
    $productIds: [String!]
  ) {
    collectivePackageEdit(
      _id: $_id
      name: $name
      description: $description
      coverImage: $coverImage
      price: $price
      productIds: $productIds
    ) {
      ...CollectivePackageFields
    }
  }
  ${COLLECTIVE_PACKAGE_FRAGMENT}
`;
