import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type BlockAdminListingLocation {
    city: String
    district: String
    subDistrict: String
    short: String
  }

  type BlockAdminListingPricing {
    amount: Float
    currency: String
    priceType: String
  }

  type BlockAdminListingSpecs {
    area: Float
    floor: Int
    totalFloors: Int
    rooms: Int
    builtYear: String
  }

  type BlockAdminListingAgent {
    _id: String
    firstName: String
    lastName: String
    email: String
  }

  type BlockAdminListing {
    _id: String
    entityId: String
    subdomain: String
    agencyId: String
    agencyMemberId: String
    title: String
    type: String
    propertyType: String
    status: String
    description: String
    location: BlockAdminListingLocation
    pricing: BlockAdminListingPricing
    specs: BlockAdminListingSpecs
    mediaAttachments: [String]
    featuredImg: String
    viewCount: Float
    isFeatured: Boolean
    agent: BlockAdminListingAgent
    createdAt: Date
    updatedAt: Date
  }

  input BlockAdminListingStatusInput {
    status: String
    isFeatured: Boolean
  }

  type BlockAdminListingListResponse {
    list: [BlockAdminListing]
    pageInfo: PageInfo
    totalCount: Int
  }

  type BlockAdminListingStats {
    total: Int!
    active: Int!
    draft: Int!
    sold: Int!
    totalViews: Float!
  }
`;

const queryParams = `
  subdomain: String
  agencyId: String
  agencyMemberId: String
  status: String
  searchValue: String
  city: String
  district: String

  ${GQL_CURSOR_PARAM_DEFS}
`;

export const queries = `
  getBlockAdminAgencyListings(${queryParams}): BlockAdminListingListResponse
  getBlockAdminAgencyListingStats(subdomain: String, agencyId: String, agencyMemberId: String): BlockAdminListingStats
  getBlockAdminAgencyListing(_id: String!): BlockAdminListing
`;

export const mutations = `
  blockAdminUpdateAgencyListingStatus(_id: String!, input: BlockAdminListingStatusInput!): BlockAdminListing
  blockAdminRemoveAgencyListing(_id: String!): BlockAdminListing
`;
