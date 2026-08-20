import { gql } from '@apollo/client';

export const GET_MEMBER_PROFILE = gql`
  query BlockAgentGetMemberProfile {
    blockAgentGetMemberProfile {
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
