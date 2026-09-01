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


export const UPDATE_MEMBER_USER_PROFILE = gql`
  mutation BlockAgentUpdateMemberUserProfile(
    $username: String!
    $email: String!
    $details: UserDetails
  ) {
    usersEditProfile(username: $username, email: $email, details: $details) {
      _id
      details {
        avatar
        fullName
      }
    }
  }
`;
