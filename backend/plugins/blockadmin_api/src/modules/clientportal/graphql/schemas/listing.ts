import { GQL_OFFSET_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type CpBlockAdminListing {
    _id: String
    agencyId: String
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

  type CpBlockAdminListingStats {
    total: Int!
    active: Int!
    draft: Int!
    totalViews: Float!
  }
`;

const queryParams = `
  agencyId: String
  type: String
  propertyType: String
  searchValue: String
  city: String
  district: String

  ${GQL_OFFSET_PARAM_DEFS}
`;

export const queries = `
  cpGetBlockAdminListings(${queryParams}): [CpBlockAdminListing]
  cpGetBlockAdminListing(_id: String!): CpBlockAdminListing
  cpGetBlockAdminListingStats(agencyId: String): CpBlockAdminListingStats
`;
