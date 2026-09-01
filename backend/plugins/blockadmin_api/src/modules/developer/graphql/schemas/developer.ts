import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type BlockAdminDeveloper {
    _id: String
    name: String
    description: String
    about: String
    logo: String
    website: String
    registrationNumber: String
    address: BlockAdminDeveloperAddressInfo
    dateFounded: String
    primaryEmail: String
    primaryPhone: String
    coverImage: String
    phones: [String]
    socialLinks: BlockAdminDeveloperSocialLink
    verificationStatus: String
    projectsCount: Int

    visibility: String
  }

  type BlockAdminDeveloperListResponse {
    list: [BlockAdminDeveloper]
    pageInfo: PageInfo
    totalCount: Int
  }

  input BlockAdminDeveloperInput {
    visibility: String
  }
`;

const queryParams = `
  verificationStatus: String
  searchValue: String
  district: String
  city: String
  dateFilters: String
  
  ${GQL_CURSOR_PARAM_DEFS}
`;

export const queries = `
  getBlockAdminDevelopers(${queryParams}): BlockAdminDeveloperListResponse
  getBlockAdminDeveloperInfo(_id: String): BlockAdminDeveloper
`;

export const mutations = `
  blockAdminUpdateDeveloper(_id: String!, input: BlockAdminDeveloperInput!): BlockAdminDeveloper
  updateBlockAdminDeveloperVerificationStatus(developerId: String, status: BlockAdminDeveloperVerificationStatusEnum): BlockAdminDeveloper
`;
