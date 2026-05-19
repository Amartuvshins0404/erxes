import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type MushopCollectiveSyncResult {
    supplierId: String
    supplier: MushopSupplier
    subdomain: String
    total: Int
    created: Int
    failed: Int
    errors: [String]
  }

  type MushopCollectiveSocialLink {
    facebook: String
    twitter: String
    instagram: String
    linkedin: String
    youtube: String
    website: String
  }

  type MushopCollective {
    _id: String!
    name: String
    description: String
    about: String
    logo: String
    coverImage: String
    attachments: [String]
    urls: [String]
    registrationNumber: String
    address: JSON
    primaryEmail: String
    primaryPhone: String
    emails: [String]
    phones: [String]
    dateFounded: String
    website: String
    socialLinks: MushopCollectiveSocialLink
    ownerUserId: String

    targetSubdomain: String
    targetPosToken: String
    supplierIds: [String]
    suppliers: [MushopSupplier]
    status: String
    syncResults: [MushopCollectiveSyncResult]
    totalCreated: Int
    totalFailed: Int
    lastSyncedAt: Date
    createdBy: String
    createdAt: Date
    updatedAt: Date
  }

  type MushopCollectiveListResponse {
    list: [MushopCollective]
    pageInfo: PageInfo
    totalCount: Int
  }
`;

const queryParams = `
  searchValue: String
  status: String
  targetSubdomain: String
  supplierId: String
`;

export const queries = `
  mushopCollectiveDetail(_id: String!): MushopCollective
  mushopCollectives(${queryParams}${GQL_CURSOR_PARAM_DEFS}): MushopCollectiveListResponse
`;

export const mutations = `
  mushopCreateCollective(
    targetSubdomain: String!
    supplierIds: [String!]!
  ): MushopCollective

  mushopUpdateCollectiveSuppliers(
    _id: String!
    supplierIds: [String!]!
  ): MushopCollective

  mushopResyncCollective(_id: String!): MushopCollective

  mushopRemoveCollective(_id: String!): JSON
`;
