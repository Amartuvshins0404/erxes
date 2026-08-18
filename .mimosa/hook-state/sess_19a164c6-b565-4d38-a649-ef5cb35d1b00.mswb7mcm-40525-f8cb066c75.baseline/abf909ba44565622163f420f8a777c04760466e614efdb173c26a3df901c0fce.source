import { gql } from '@apollo/client';

export const UPDATE_AGENCY = gql`
  mutation UpdateAgencyInfo($input: AgencyInput!) {
    updateAgencyInfo(input: $input) {
      _id
    }
  }
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
      certificatePhotos
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
      certificatePhotos
      role
      createdAt
      updatedAt
    }
  }
`;
