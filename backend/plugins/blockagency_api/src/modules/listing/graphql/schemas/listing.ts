import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type BlockListingLocation {
    city: String
    district: String
    subDistrict: String
    short: String
    lat: Float
    lng: Float
  }

  type BlockListingPricing {
    amount: Float
    currency: String
    priceType: ListingPriceType
  }

  type BlockListingSpecs {
    area: Float
    floor: Int
    totalFloors: Int
    rooms: Int
    builtYear: String
  }

  type BlockListingAgent {
    _id: String
    firstName: String
    lastName: String
    email: String
  }

  type BlockListing {
    _id: String!
    title: String
    type: ListingType
    propertyType: String
    status: ListingStatus
    description: String
    location: BlockListingLocation
    pricing: BlockListingPricing
    specs: BlockListingSpecs
    mediaAttachments: [String]
    featuredImg: String
    viewCount: Float
    memberId: String
    agent: BlockListingAgent
    createdAt: Date
    updatedAt: Date
  }

  type BlockListingListResponse {
    list: [BlockListing]
    pageInfo: PageInfo
    totalCount: Int
  }

  type BlockListingStats {
    total: Int!
    active: Int!
    draft: Int!
    totalViews: Float!
  }

  enum ListingType {
    sale
    rent
    lease
  }

  enum ListingStatus {
    active
    inactive
    sold
    draft
  }

  enum ListingPriceType {
    fixed
    negotiable
    onRequest
  }

  input GeoPointInput {
    type: String
    coordinates: [Float]
  }

  input BlockListingLocationInput {
    city: String
    district: String
    subDistrict: String
    short: String
    lat: Float
    lng: Float
  }

  input BlockListingPricingInput {
    amount: Float
    currency: String
    priceType: ListingPriceType
  }

  input BlockListingSpecsInput {
    area: Float
    floor: Int
    totalFloors: Int
    rooms: Int
    builtYear: String
  }

  input BlockListingInput {
    title: String!
    type: ListingType
    propertyType: String
    status: ListingStatus
    description: String
    location: BlockListingLocationInput
    pricing: BlockListingPricingInput
    specs: BlockListingSpecsInput
    mediaAttachments: [String]
    featuredImg: String
    viewCount: Float
    memberId: String
  }
`;

const queryParams = `
  status: String
  searchValue: String
  district: String
  city: String

  ${GQL_CURSOR_PARAM_DEFS}
`;

export const queries = `
  blockGetListing(_id: String!): BlockListing
  blockGetListings(${queryParams}): BlockListingListResponse
  blockGetListingStats: BlockListingStats
`;

export const mutations = `
  blockCreateListing(input: BlockListingInput!): BlockListing
  blockUpdateListingGeneralInfo(_id: String!, input: BlockListingInput!): BlockListing
  blockRemoveListing(_id: String!): BlockListing
`;
