import { gql } from '@apollo/client';

export const BLOCK_ADMIN_GET_DEVELOPER_INFO = gql`
  query GetBlockAdminDeveloperInfo($_id: String) {
    getBlockAdminDeveloperInfo(_id: $_id) {
      _id
      name
      description
      about
      logo
      website
      registrationNumber
      address {
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
        location {
          type
          coordinates
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

      isFeatured
    }
  }
`;
