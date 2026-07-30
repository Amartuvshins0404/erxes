import {
  GQL_CURSOR_PARAM_DEFS,
  GQL_OFFSET_PARAM_DEFS,
} from 'erxes-api-shared/utils';

export const types = `
  type MushopSupplierSocialLink {
    facebook: String
    twitter: String
    instagram: String
    linkedin: String
    youtube: String
    website: String
  }

  type MushopSupplier {
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
    socialLinks: MushopSupplierSocialLink
    ownerUserId: String
    posToken: String
    mushopPosToken: String
    createdAt: Date
    updatedAt: Date
  }

  type MushopPosConfig {
    _id: String
    name: String
    token: String
  }

  type MushopSupplierListResponse {
    list: [MushopSupplier]
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
  mushopSupplierDetail(_id: String!): MushopSupplier
  mushopSuppliers(${supplierQueryParams}${GQL_CURSOR_PARAM_DEFS}): MushopSupplierListResponse
  mushopSupplierPosList(supplierId: String!): [MushopPosConfig]

  cpMushopSupplierDetail(_id: String!): MushopSupplier
  cpMushopSuppliers(${supplierQueryParams}${GQL_OFFSET_PARAM_DEFS}): [MushopSupplier]
`;

export const mutations = `
  mushopUpdateSupplierVerificationStatus(_id: String!, verificationStatus: String!, note: String): MushopSupplier
  mushopUpdateSupplierTier(_id: String!, tierLevel: Int!): MushopSupplier
  mushopUpdateSupplierPos(_id: String!, posToken: String!): MushopSupplier
  mushopUpdateSupplierMushopPos(_id: String!, mushopPosToken: String!): MushopSupplier
`;
