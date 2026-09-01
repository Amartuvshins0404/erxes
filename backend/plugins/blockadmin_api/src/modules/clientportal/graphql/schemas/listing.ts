import { GQL_OFFSET_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type CpBlockAdminListing {
    _id: String
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
    agency: CpBlockAdminAgency
    createdAt: Date
    updatedAt: Date
  }

  type CpBlockAdminListingStats {
    total: Int!
    active: Int!
    draft: Int!
    sold: Int!
    totalViews: Float!
  }
`;

const queryParams = `
  agencyId: String
  agencyMemberId: String
  status: String
  type: String
  propertyType: String
  searchValue: String
  city: String
  district: String

  ${GQL_OFFSET_PARAM_DEFS}
`;

export const queries = `
  cpGetBlockAdminAgencyListings(${queryParams}): [CpBlockAdminListing]
  cpGetBlockAdminAgencyListing(_id: String!): CpBlockAdminListing
  cpGetBlockAdminAgencyListingStats(agencyId: String, agencyMemberId: String): CpBlockAdminListingStats
`;
