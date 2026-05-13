import { gql } from '@apollo/client';

export const GET_AGENCY_INFO = gql`
  query GetAgencyInfo {
    getAgencyInfo {
      _id
      name
      brandName
      type
      description
      brief
      logo
      coverImage
      documents
      website
      emails
      primaryEmail
      phones
      primaryPhone
      socialLinks
      dateFounded
      operationArea {
        city
        district
      }
      fieldsOfExpertise {
        propertyTypes
        services
        clientTypes
      }
    }
  }
`;

export const GET_AGENCY_MEMBERS = gql`
  query BlockAgentGetMembers($agencyId: String, $page: Int, $perPage: Int) {
    blockAgentGetMembers(agencyId: $agencyId, page: $page, perPage: $perPage) {
      _id
      role
      updatedAt
      memberId
      linkedUrl
      instagramUrl
      facebookUrl
      district
      description
      createdAt
      country
      city
      certificatePhotos
      agencyId
      member {
        _id
        details {
          avatar
          fullName
        }
      }
    }
  }
`;
