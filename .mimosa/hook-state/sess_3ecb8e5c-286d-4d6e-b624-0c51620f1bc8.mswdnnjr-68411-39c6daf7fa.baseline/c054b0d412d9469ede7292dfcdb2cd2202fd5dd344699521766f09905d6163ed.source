import { gql } from '@apollo/client';

export const BTK_GET_ADMIN_SUBMISSIONS = gql`
  query BtkAdminGetSubmissions($query: BtkSubmissionsQueryInput) {
    btkAdminGetSubmissions(query: $query) {
      list {
        _id
        email
        name
        phone
        answer1
        answer2
        answer3
        answer4
        answer5
        answer6
        submittedAt
      }
      totalCount
    }
  }
`;
