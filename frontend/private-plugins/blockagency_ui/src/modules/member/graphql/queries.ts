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


export const GET_MEMBER_USER_DETAIL = gql`
  query BlockAgentGetMemberUserDetail($_id: String) {
    userDetail(_id: $_id) {
      _id
      username
      email
      details {
        avatar
        coverPhoto
        fullName
        shortName
        birthDate
        position
        workStartedDate
        location
        description
        operatorPhone
        firstName
        middleName
        lastName
        employeeId
      }
    }
  }
`;
