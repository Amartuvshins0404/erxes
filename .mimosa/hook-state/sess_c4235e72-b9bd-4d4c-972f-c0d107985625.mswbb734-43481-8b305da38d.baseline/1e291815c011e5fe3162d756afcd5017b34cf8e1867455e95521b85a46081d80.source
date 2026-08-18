import { gql } from '@apollo/client';
import { GQL_PAGE_INFO } from 'erxes-ui';

export const GET_CLIENT_PORTALS_FOR_SELECT = gql`
  query GetClientPortalsForSelect {
    getClientPortals(filter: { limit: 200, direction: forward }) {
      list {
        _id
        name
      }
      totalCount
    }
  }
`;

export const GET_CLIENT_PORTAL_USERS_FOR_SELECT = gql`
  query GetClientPortalUsersForSelect(
    $searchValue: String
    $clientPortalId: String
    $cursor: String
    $limit: Int
    $direction: CURSOR_DIRECTION
  ) {
    getClientPortalUsers(
      filter: {
        searchValue: $searchValue
        clientPortalId: $clientPortalId
        cursor: $cursor
        limit: $limit
        direction: $direction
      }
    ) {
      list {
        _id
        clientPortalId
        email
        phone
        firstName
        lastName
        username
      }
      ${GQL_PAGE_INFO}
    }
  }
`;

export const GET_CLIENT_PORTAL_USER_FOR_SELECT = gql`
  query GetClientPortalUserForSelect($_id: String!) {
    getClientPortalUser(_id: $_id) {
      _id
      clientPortalId
      email
      phone
      firstName
      lastName
      username
    }
  }
`;
