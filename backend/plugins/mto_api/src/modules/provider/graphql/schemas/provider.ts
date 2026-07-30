import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type MtoMultilingualString {
    en: String!
    mn: String!
  }

  type MtoMultilingualStringOptional {
    en: String
    mn: String
  }

  input MtoMultilingualStringInput {
    en: String!
    mn: String!
  }

  input MtoMultilingualStringOptionalInput {
    en: String
    mn: String
  }

  type MtoActivityAssociation {
    _id: String
    name: MtoMultilingualString
    logo: String
    level: String
    parentId: String
    parent: MtoActivityAssociation
    isActive: Boolean
    createdAt: Date
    modifiedAt: Date
  }

  type MtoContactInfo {
    phone: String
    email: String
    website: String
  }

  type MtoProvider {
    _id: String
    createdAt: Date
    modifiedAt: Date
    businessName: MtoMultilingualString
    description: MtoMultilingualStringOptional
    contactInfo: MtoContactInfo
    facilities: [String]
    associationIds: [String]
    associations: [MtoActivityAssociation]
    singleProviderLimit: Int
    status: String
    rejectionReason: String
    approvedAt: Date
    approvedBy: String
    rejectedBy: String
    isActive: Boolean
    icon: String
    coverImages: [String]
    instanceId: String
  }

  type MtoProviderListResponse {
    list: [MtoProvider]
    pageInfo: PageInfo
    totalCount: Int
  }

  input MtoContactInfoInput {
    phone: String!
    email: String!
    website: String
  }
`;

const queryParams = `
  searchValue: String,
  status: String,
  associationId: String,
  isActive: Boolean,
  hasScheduleFutureOrNow: Boolean,
`;

export const queries = `
  mtoProviders(${queryParams}, ${GQL_CURSOR_PARAM_DEFS}): MtoProviderListResponse
  mtoProvidersCount(${queryParams}): Int
  mtoProvider(_id: String): MtoProvider
`;

const mutationParams = `
  businessName: MtoMultilingualStringInput
  description: MtoMultilingualStringOptionalInput
  contactInfo: MtoContactInfoInput
  facilities: [String]
  associationIds: [String]!
  singleProviderLimit: Int
  isActive: Boolean
  icon: String
  coverImages: [String]
`;

export const mutations = `
  mtoProviderCreate(${mutationParams}): MtoProvider
  mtoProviderUpdate(_id: String!, ${mutationParams}): MtoProvider
  mtoProviderApprove(_id: String!, approvedBy: String!): MtoProvider
  mtoProviderReject(_id: String!, rejectionReason: String!, rejectedBy: String!): MtoProvider
  mtoProvidersRemove(ids: [String]!): JSON
`;
