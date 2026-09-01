import { gql } from '@apollo/client';

export const BLOCK_ADMIN_REMOVE_LISTING = gql`
  mutation BlockAdminRemoveAgencyListing($_id: String!) {
    blockAdminRemoveAgencyListing(_id: $_id) {
      _id
    }
  }
`;

export const BLOCK_ADMIN_UPDATE_LISTING_STATUS = gql`
  mutation BlockAdminUpdateAgencyListingStatus(
    $_id: String!
    $input: BlockAdminListingStatusInput!
  ) {
    blockAdminUpdateAgencyListingStatus(_id: $_id, input: $input) {
      _id
      status
      isFeatured
    }
  }
`;
