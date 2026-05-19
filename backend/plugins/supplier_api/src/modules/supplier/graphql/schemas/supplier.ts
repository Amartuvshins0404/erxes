import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type SupplierSocialLink {
    facebook: String
    twitter: String
    instagram: String
    linkedin: String
    youtube: String
    website: String
  }

  type SupplierAddressInfo {
    short: String
    countryCode: String
    country: String
    postCode: String
    city: String
    city_district: String
    suburb: String
    road: String
    street: String
    building: String
    number: String
    other: String
  }

  type SupplierAddress {
    address: SupplierAddressInfo
    location: JSON
    short: String
  }

  type Supplier {
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
    verificationStatus: String
    verificationNote: String
    tierLevel: Int
    socialLinks: SupplierSocialLink
    ownerUserId: String
    createdAt: Date
    updatedAt: Date
  }

  type SupplierListResponse {
    list: [Supplier]
    pageInfo: PageInfo
    totalCount: Int
  }

  input SupplierInput {
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
    socialLinks: JSON
  }
`;

const supplierQueryParams = `
  searchValue: String
  verificationStatus: String
  city: String
  district: String
  dateFilters: String
  isFeatured: Boolean
  ${GQL_CURSOR_PARAM_DEFS}
`;

export const queries = `
  getSupplier: Supplier
  supplierDetail(_id: String!): Supplier
  suppliers(${supplierQueryParams}): SupplierListResponse
`;

export const mutations = `
  supplierUpdateProfile(input: SupplierInput!): Supplier
  supplierUpdateVerificationStatus(_id: String!, status: String!): Supplier
  supplierUpdateTierLevel(_id: String!, tierLevel: Int!): Supplier
`;
