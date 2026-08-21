import { gql } from '@apollo/client';
import { AGENCY_INFO_FIELDS } from './fragments';

export const GET_AGENCY_INFO = gql`
  query GetAgencyInfo {
    getAgencyInfo {
      ...BlockAgencyInfoFields
    }
  }
  ${AGENCY_INFO_FIELDS}
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
      certificatePhotos {
        url
        name
        type
        size
      }
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
