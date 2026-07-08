import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type BaSupplierSocialLink {
    facebook: String
    twitter: String
    instagram: String
    linkedin: String
    youtube: String
    website: String
  }

  type BaSupplier {
    _id: String!
    code: String
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
    verificationStatus: String
    verificationNote: String
    tierLevel: Int
    socialLinks: BaSupplierSocialLink
    ownerUserId: String
    posToken: String
    createdAt: Date
    updatedAt: Date
  }

  type BaSupplierListResponse {
    list: [BaSupplier]
    pageInfo: PageInfo
    totalCount: Int
  }
`;

const supplierQueryParams = `
  searchValue: String
  verificationStatus: String
  city: String
  district: String
  dateFilters: String
  isFeatured: Boolean
`;

export const queries = `
  baSupplierDetail(_id: String!): BaSupplier
  baSuppliers(${supplierQueryParams}${GQL_CURSOR_PARAM_DEFS}): BaSupplierListResponse
`;

export const mutations = `
  baUpdateSupplierVerificationStatus(_id: String!, verificationStatus: String!, note: String): BaSupplier
  baUpdateSupplierTier(_id: String!, tierLevel: Int!): BaSupplier
`;
