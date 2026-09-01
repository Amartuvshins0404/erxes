import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type OroltsooPost @key(fields: "_id") {
    _id: String!
    title: String
    excerpt: String
    content: String
    coverImage: String
    tags: [String]
    status: String
    publishedAt: Date
    createdAt: Date
    updatedAt: Date
  }

  type OroltsooPostListResponse {
    list: [OroltsooPost]
    pageInfo: PageInfo
    totalCount: Int
  }

  input OroltsooPostInput {
    title: String!
    excerpt: String
    content: String
    coverImage: String
    tags: [String]
    status: String
    publishedAt: Date
  }
`;

const listParams = `
  searchValue: String
  status: String
  tag: String
  publishedFrom: Date
  publishedTo: Date

  ${GQL_CURSOR_PARAM_DEFS}
`;

export const queries = `
  oroltsooPosts(${listParams}): OroltsooPostListResponse
  oroltsooPostDetail(_id: String!): OroltsooPost
`;

export const mutations = `
  oroltsooPostAdd(input: OroltsooPostInput!): OroltsooPost
  oroltsooPostEdit(_id: String!, input: OroltsooPostInput!): OroltsooPost
  oroltsooPostRemove(_ids: [String!]!): JSON
`;
