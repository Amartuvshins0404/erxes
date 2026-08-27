import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type OroltsooAdminPost @key(fields: "_id") {
    _id: String!
    subdomain: String
    entityId: String

    title: String
    excerpt: String
    content: String
    coverImage: String
    tags: [String]
    status: String
    publishedAt: Date
    syncedAt: Date

    createdAt: Date
    updatedAt: Date
  }

  type OroltsooAdminPostListResponse {
    list: [OroltsooAdminPost]
    pageInfo: PageInfo
    totalCount: Int
  }
`;

const listParams = `
  searchValue: String
  subdomain: String
  status: String
  tag: String

  ${GQL_CURSOR_PARAM_DEFS}
`;

export const queries = `
  oroltsooAdminPosts(${listParams}): OroltsooAdminPostListResponse
  oroltsooAdminPostDetail(_id: String!): OroltsooAdminPost
`;
