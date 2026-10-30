import { gql } from '@apollo/client';

export const TAGS_QUERY = gql`
  query TagsMain($type: String, $excludeWorkspaceTags: Boolean) {
    tagsMain(type: $type, excludeWorkspaceTags: $excludeWorkspaceTags) {
      _id
      name
      colorCode
      parentId
      relatedIds
      isGroup
      description
      type
      objectCount
      totalObjectCount
      createdAt
    }
  }
`;

export const TAG_QUERY = gql`
  query TagBadge($id: String!) {
    tagDetail(_id: $id) {
      _id
      name
      colorCode
      isGroup
    }
  }
`;

export const TAGS_LIST_QUERY = gql`
  query TagsList(
    $type: String
    $searchValue: String
    $parentId: String
    $cursor: String
    $limit: Int
    $direction: CURSOR_DIRECTION
    $isGroup: Boolean
    $includeWorkspaceTags: Boolean
  ) {
    tags(
      type: $type
      searchValue: $searchValue
      parentId: $parentId
      cursor: $cursor
      limit: $limit
      direction: $direction
      isGroup: $isGroup
      includeWorkspaceTags: $includeWorkspaceTags
    ) {
      list {
        _id
        name
        colorCode
        parentId
        isGroup
        type
        description
        objectCount
        totalObjectCount
        createdAt
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
