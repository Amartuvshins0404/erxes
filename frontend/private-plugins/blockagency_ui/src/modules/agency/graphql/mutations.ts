import { gql } from '@apollo/client';
import { AGENCY_INFO_FIELDS } from './fragments';

export const UPDATE_AGENCY = gql`
  mutation UpdateAgencyInfo($input: AgencyInput!) {
    updateAgencyInfo(input: $input) {
      ...BlockAgencyInfoFields
    }
  }
  ${AGENCY_INFO_FIELDS}
`;

export const CREATE_AGENCY_MEMBER = gql`
  mutation BlockAgentCreateMember($agencyId: String, $memberIds: [String!]!) {
    blockAgentCreateMember(agencyId: $agencyId, memberIds: $memberIds) {
      _id
      agencyId
      memberId
      description
      country
      city
      district
      facebookUrl
      instagramUrl
      linkedUrl
      certificatePhotos {
        url
        name
        type
        size
      }
      role
      createdAt
      updatedAt
    }
  }
`;

export const REMOVE_AGENCY_MEMBER = gql`
  mutation BlockAgentRemoveMember($id: String!) {
    blockAgentRemoveMember(_id: $id)
  }
`;

export const UPDATE_AGENCY_MEMBER = gql`
  mutation BlockAgentUpdateMember($id: String!, $input: MemberInput!) {
    blockAgentUpdateMember(_id: $id, input: $input) {
      _id
      agencyId
      memberId
      description
      country
      city
      district
      facebookUrl
      instagramUrl
      linkedUrl
      certificatePhotos {
        url
        name
        type
        size
      }
      role
      createdAt
      updatedAt
    }
  }
`;
