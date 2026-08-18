import { gql } from '@apollo/client';

const LISTING_FIELDS = `
  _id
  title
  type
  propertyType
  status
  description
  featuredImg
  viewCount
  memberId
  mediaAttachments
  location {
    city
    district
    subDistrict
    short
    lat
    lng
  }
  pricing {
    amount
    currency
    priceType
  }
  specs {
    area
    floor
    totalFloors
    rooms
    builtYear
  }
`;

export const CREATE_LISTING = gql`
  mutation BlockCreateListing($input: BlockListingInput!) {
    blockCreateListing(input: $input) {
      ${LISTING_FIELDS}
    }
  }
`;

export const UPDATE_LISTING = gql`
  mutation BlockUpdateListingGeneralInfo(
    $_id: String!
    $input: BlockListingInput!
  ) {
    blockUpdateListingGeneralInfo(_id: $_id, input: $input) {
      ${LISTING_FIELDS}
    }
  }
`;

export const REMOVE_LISTING = gql`
  mutation BlockRemoveListing($_id: String!) {
    blockRemoveListing(_id: $_id) {
      _id
    }
  }
`;
