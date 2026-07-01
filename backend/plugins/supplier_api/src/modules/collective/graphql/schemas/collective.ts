import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type CollectiveSocialLink {
    facebook: String
    twitter: String
    instagram: String
    linkedin: String
    youtube: String
    website: String
  }

  type Collective {
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
    paymentId: String
    verificationStatus: String
    verificationNote: String
    tierLevel: Int
    socialLinks: CollectiveSocialLink
    ownerUserId: String
    createdAt: Date
    updatedAt: Date
  }

  type CollectiveMemberSupplier {
    _id: String!
    name: String
    logo: String
    primaryEmail: String
    primaryPhone: String
    verificationStatus: String
  }

  input CollectiveInput {
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
    paymentId: String
    socialLinks: JSON
  }

  input CollectivePackageInput {
    name: String!
    description: String
    coverImage: String
    posToken: String!
    productIds: [String!]!
    price: Float
    status: String
  }

  type CollectivePackage {
    _id: String!
    name: String
    description: String
    coverImage: String
    collectiveId: String!
    posToken: String!
    productIds: [String]
    price: Float
    status: String
    createdAt: Date
    updatedAt: Date
  }


  type CollectivePackageListResponse {
    list: [CollectivePackage]
    pageInfo: PageInfo
    totalCount: Int
  }
`;

export const queries = `
  getCollective: Collective
  collectiveDetail(_id: String!): Collective
  collectiveSuppliers: [CollectiveMemberSupplier]
  collectivePackages(
    searchValue: String
    status: String
    ${GQL_CURSOR_PARAM_DEFS}
  ): CollectivePackageListResponse
  collectivePackageDetail(_id: String!): CollectivePackage
`;

export const mutations = `
  collectiveUpdateProfile(input: CollectiveInput!): Collective
  collectivePackageAdd(input: CollectivePackageInput!): CollectivePackage
  collectivePackageEdit(
    _id: String!
    name: String
    description: String
    coverImage: String
    price: Float
    productIds: [String!]
  ): CollectivePackage
  collectivePackageEditStatus(_id: String!, status: String!): CollectivePackage
`;
