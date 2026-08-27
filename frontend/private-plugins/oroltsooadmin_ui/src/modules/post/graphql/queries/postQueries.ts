import { gql } from '@apollo/client';

const ADMIN_POST_LIST_FIELDS = `
  _id
  subdomain
  entityId
  title
  excerpt
  coverImage
  tags
  status
  publishedAt
  syncedAt
`;

export const OROLTSOO_ADMIN_POSTS = gql`
  query OroltsooAdminPosts(
    $searchValue: String
    $subdomain: String
    $status: String
    $tag: String
    $limit: Int
    $cursor: String
    $direction: CURSOR_DIRECTION
  ) {
    oroltsooAdminPosts(
      searchValue: $searchValue
      subdomain: $subdomain
      status: $status
      tag: $tag
      limit: $limit
      cursor: $cursor
      direction: $direction
    ) {
      list {
        ${ADMIN_POST_LIST_FIELDS}
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

export const OROLTSOO_ADMIN_POST_DETAIL = gql`
  query OroltsooAdminPostDetail($id: String!) {
    oroltsooAdminPostDetail(_id: $id) {
      ${ADMIN_POST_LIST_FIELDS}
      content
    }
  }
`;
