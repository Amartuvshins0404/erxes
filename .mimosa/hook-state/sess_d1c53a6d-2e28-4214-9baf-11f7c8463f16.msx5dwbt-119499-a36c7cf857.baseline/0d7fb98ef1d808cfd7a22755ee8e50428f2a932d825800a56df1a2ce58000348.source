import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

const BLOCK_GET_SUBMISSIONS = gql`
  query BlockAdminGetSubmissions(
    $formId: Int
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    blockAdminGetSubmissions(
      formId: $formId
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        lead {
          _id
          firstName
          lastName
          primaryEmail
          primaryPhone
          state
        }
        form
        answer1
        answer2
        answer3
        answer4
        answer5
        answer6
        submittedAt
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

export { BLOCK_GET_SUBMISSIONS };
