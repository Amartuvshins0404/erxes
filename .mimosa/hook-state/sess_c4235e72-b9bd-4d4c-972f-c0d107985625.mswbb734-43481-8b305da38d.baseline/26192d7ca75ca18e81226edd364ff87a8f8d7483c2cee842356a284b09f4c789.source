import { gql } from '@apollo/client';

export const BLOCK_GET_DEVELOPER_INFO = gql`
  query GetDeveloperInfo {
    getDeveloperInfo {
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
    }
  }
`;
