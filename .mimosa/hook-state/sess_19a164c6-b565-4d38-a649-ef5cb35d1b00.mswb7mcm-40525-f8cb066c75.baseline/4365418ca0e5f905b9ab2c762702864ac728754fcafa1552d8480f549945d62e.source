import { gql } from '@apollo/client';

export const UPDATE_MEMBER_PROFILE = gql`
  mutation BlockAgentUpdateMemberProfile($input: MemberInput!) {
    blockAgentUpdateMemberProfile(input: $input) {
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
