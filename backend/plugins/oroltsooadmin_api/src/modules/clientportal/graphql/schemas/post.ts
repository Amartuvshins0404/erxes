import { GQL_OFFSET_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type CpOroltsooPost {
    _id: String
    subdomain: String

    title: String
    excerpt: String
    content: String
    coverImage: String
    tags: [String]
    publishedAt: Date

    createdAt: Date
    updatedAt: Date
  }
`;

const queryParams = `
  searchValue: String
  subdomain: String
  profileId: String
  tag: String
  publishedFrom: Date
  publishedTo: Date

  ${GQL_OFFSET_PARAM_DEFS}
`;

export const queries = `
  cpGetOroltsooPosts(${queryParams}): [CpOroltsooPost]
  cpGetOroltsooPost(_id: String!): CpOroltsooPost
`;
