import { gql } from '@apollo/client';
import { GQL_PAGE_INFO } from 'erxes-ui';

export const GET_CV_RISK_GROUP_DETAIL = gql`
  query GetCVRiskGroup($id: String!) {
    cvGetRiskGroup(_id: $id) {
      _id
      name
      client
      effective_date
      expiration_date
      createdAt
      updatedAt
    }
  }
`;

export const GET_CV_RISK_GROUPS = gql`
  query CvGetRiskGroups(
    $filter: CVRiskGroupFilterInput
    $limit: Int
    $cursor: String
    $cursorMode: CURSOR_MODE
    $direction: CURSOR_DIRECTION
    $orderBy: JSON
    $sortMode: String
    $aggregationPipeline: [JSON]
  ) {
    cvGetRiskGroups(
      filter: $filter
      limit: $limit
      cursor: $cursor
      cursorMode: $cursorMode
      direction: $direction
      orderBy: $orderBy
      sortMode: $sortMode
      aggregationPipeline: $aggregationPipeline
    ) {
      list {
        _id
        name
        client
        effective_date
        expiration_date
        createdAt
        updatedAt
      }
      ${GQL_PAGE_INFO}
    }
  }
`;

