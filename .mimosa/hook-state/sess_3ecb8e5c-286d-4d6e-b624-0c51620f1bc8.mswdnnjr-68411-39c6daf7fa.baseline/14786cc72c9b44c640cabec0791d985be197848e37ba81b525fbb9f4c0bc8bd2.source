import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

const BLOCK_ADMIN_GET_DEVELOPERS = gql`
  query GetBlockAdminDevelopers(
    $verificationStatus: String
    $searchValue: String
    $city: String
    $district: String
    $dateFilters: String    

    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    getBlockAdminDevelopers(
      verificationStatus: $verificationStatus
      searchValue: $searchValue
      city: $city
      district: $district
      dateFilters: $dateFilters

      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        name
        description
        about
        logo
        website
        registrationNumber
        address {
          location {
            type
            coordinates
          }
          address {
            countryCode
            country
            postCode
            city
            city_district
            suburb
            road
            street
            building
            number
            other
          }
          short
        }
        dateFounded
        primaryEmail
        primaryPhone
        coverImage
        phones
        socialLinks {
          facebook
          twitter
          instagram
          linkedin
          youtube
          website
        }
        verificationStatus
        projectsCount
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

const BLOCK_ADMIN_GET_DEVELOPERS_INLINE = gql`
  query GetBlockAdminDevelopers(
    $searchValue: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    getBlockAdminDevelopers(
      searchValue: $searchValue
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        name
        verificationStatus
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export { BLOCK_ADMIN_GET_DEVELOPERS, BLOCK_ADMIN_GET_DEVELOPERS_INLINE };
