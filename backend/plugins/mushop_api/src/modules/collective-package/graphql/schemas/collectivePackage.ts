import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type MushopCollectivePackage {
    _id: String!
    name: String
    description: String
    coverImage: String

    collectiveId: String!
    collective: MushopCollective

    posToken: String!

    productIds: [String]
    products: [MushopProduct]

    price: Float
    componentsTotal: Float

    status: String
    createdAt: Date
    updatedAt: Date
  }

  type MushopCollectivePackageListResponse {
    list: [MushopCollectivePackage]
    pageInfo: PageInfo
    totalCount: Int
  }
`;

const queryParams = `
  collectiveId: String!
  searchValue: String
  status: String
`;

export const queries = `
  mushopCollectivePackageDetail(_id: String!): MushopCollectivePackage
  mushopCollectivePackages(${queryParams}${GQL_CURSOR_PARAM_DEFS}): MushopCollectivePackageListResponse
`;

export const mutations = ``;
