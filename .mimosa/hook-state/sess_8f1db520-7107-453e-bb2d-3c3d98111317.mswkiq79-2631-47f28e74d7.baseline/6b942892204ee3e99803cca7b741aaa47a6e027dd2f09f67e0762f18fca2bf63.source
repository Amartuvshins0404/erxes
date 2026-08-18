import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const ONE_FIT_BANNERS = gql`
  query OneFitBanners(
    $providerId: String
    $type: String
    $status: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    oneFitBanners(
      providerId: $providerId
      type: $type
      status: $status
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        createdAt
        modifiedAt
        image
        providerId
        type
        status
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

export const ONE_FIT_BANNERS_COUNT = gql`
  query OneFitBannersCount(
    $providerId: String
    $type: String
    $status: String
  ) {
    oneFitBannersCount(
      providerId: $providerId
      type: $type
      status: $status
    )
  }
`;

export const ONE_FIT_BANNER = gql`
  query OneFitBanner($_id: String!) {
    oneFitBanner(_id: $_id) {
      _id
      createdAt
      modifiedAt
      image
      providerId
      type
      status
    }
  }
`;
