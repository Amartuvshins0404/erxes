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

  type MtoContactInfo {
    phone: String
    email: String
    website: String
  }

  type MtoProfile {
    _id: String
    createdAt: Date
    modifiedAt: Date
    businessName: MtoMultilingualString
    description: MtoMultilingualStringOptional
    contactInfo: MtoContactInfo
    status: String
    rejectionReason: String
    approvedAt: Date
    approvedBy: String
    rejectedBy: String
    isActive: Boolean
    icon: String
    coverImages: [String]
    address: String
    certificateNo: String
    instanceId: String
  }

  type MtoProfileListResponse {
    list: [MtoProfile]
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
  categoryId: String,
  isActive: Boolean,
  hasScheduleFutureOrNow: Boolean,
`;

export const queries = `
  mtoProfiles(${queryParams}, ${GQL_CURSOR_PARAM_DEFS}): MtoProfileListResponse
  mtoProfilesCount(${queryParams}): Int
  mtoProfile(_id: String): MtoProfile
  mtoMyProfile: MtoProfile
`;

const mutationParams = `
  businessName: MtoMultilingualStringInput
  description: MtoMultilingualStringOptionalInput
  contactInfo: MtoContactInfoInput
  isActive: Boolean
  icon: String
  coverImages: [String]
  address: String
  certificateNo: String
`;

export const mutations = `
  mtoProfileCreate(${mutationParams}): MtoProfile
  mtoProfileUpdate(_id: String!, ${mutationParams}): MtoProfile
  mtoProfileApprove(_id: String!, approvedBy: String!): MtoProfile
  mtoProfileReject(_id: String!, rejectionReason: String!, rejectedBy: String!): MtoProfile
  mtoProfilesRemove(ids: [String]!): JSON
`;
