import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const ONE_FIT_PROVIDER_REVIEW_SUMMARY = gql`
  query OneFitProviderReviewSummary($providerId: String!) {
    oneFitProviderReviewSummary(providerId: $providerId) {
      averageRating
      reviewCount
    }
  }
`;

export const ONE_FIT_PROVIDER_REVIEW_REMOVE = gql`
  mutation OneFitProviderReviewRemove($id: String!, $providerId: String!) {
    oneFitProviderReviewRemove(_id: $id, providerId: $providerId)
  }
`;

export const ONE_FIT_PROVIDER_REVIEWS = gql`
  query OneFitProviderReviews(
    $providerId: String!
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    oneFitProviderReviews(
      providerId: $providerId
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        providerId
        userId
        bookingId
        activityTypeId
        rating
        comment
        createdAt
        modifiedAt
        user {
          _id
          firstName
          lastName
          primaryEmail
        }
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
