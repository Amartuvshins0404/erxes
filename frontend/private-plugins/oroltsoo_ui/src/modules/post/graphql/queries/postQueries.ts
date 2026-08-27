import { gql } from '@apollo/client';

const POST_FIELDS = `
  _id
  title
  excerpt
  content
  coverImage
  tags
  status
  publishedAt
  createdAt
  updatedAt
`;

export const OROLTSOO_POSTS = gql`
  query OroltsooPosts(
    $searchValue: String
    $status: String
    $tag: String
    $limit: Int
    $cursor: String
    $direction: CURSOR_DIRECTION
  ) {
    oroltsooPosts(
      searchValue: $searchValue
      status: $status
      tag: $tag
      limit: $limit
      cursor: $cursor
      direction: $direction
    ) {
      list {
        ${POST_FIELDS}
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const OROLTSOO_POST_FIELDS = POST_FIELDS;
