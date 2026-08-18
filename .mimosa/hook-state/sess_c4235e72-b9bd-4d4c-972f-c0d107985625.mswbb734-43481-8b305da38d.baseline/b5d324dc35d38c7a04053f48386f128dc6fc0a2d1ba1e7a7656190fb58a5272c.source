import { gql } from '@apollo/client';

export const BLOCK_ADMIN_REMOVE_LISTING = gql`
  mutation BlockAdminRemoveListing($_id: String!) {
    blockAdminRemoveListing(_id: $_id) {
      _id
    }
  }
`;

export const BLOCK_ADMIN_UPDATE_LISTING_STATUS = gql`
  mutation BlockAdminUpdateListingStatus(
    $_id: String!
    $input: BlockAdminListingStatusInput!
  ) {
    blockAdminUpdateListingStatus(_id: $_id, input: $input) {
      _id
      status
      isFeatured
    }
  }
`;
