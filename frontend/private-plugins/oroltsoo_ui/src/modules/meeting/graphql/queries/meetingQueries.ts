import { gql } from '@apollo/client';

const MEETING_FIELDS = `
  _id
  title
  location
  scheduledAt
  note
  status
  createdAt
  updatedAt
`;

export const OROLTSOO_MEETINGS = gql`
  query OroltsooMeetings(
    $searchValue: String
    $status: String
    $limit: Int
    $cursor: String
    $direction: CURSOR_DIRECTION
  ) {
    oroltsooMeetings(
      searchValue: $searchValue
      status: $status
      limit: $limit
      cursor: $cursor
      direction: $direction
    ) {
      list {
        ${MEETING_FIELDS}
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
