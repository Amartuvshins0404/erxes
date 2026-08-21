import { gql } from '@apollo/client';

export const GET_AGENCIES = gql`
  query GetAgencies($searchValue: String, $city: String, $district: String) {
    getBlockAdminAgencies(
      searchValue: $searchValue
      city: $city
      district: $district
    ) {
      list {
        _id
        entityId
        name
        brandName
        type
        description
        brief
        logo {
          name
          url
          size
          type
        }
        coverImage {
          name
          url
          size
          type
        }
        documents {
          name
          url
          size
          type
        }
        website
        emails
        primaryEmail
        phones
        primaryPhone
        socialLinks
        dateFounded
        verificationStatus
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
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_AGENCY_AGENTS = gql`
  query BlockAdminAgencyAgents($agencyId: String, $searchValue: String) {
    getBlockAdminAgents(agencyId: $agencyId, searchValue: $searchValue) {
      list {
        _id
        agencyId
        memberId
        role
        description
        country
        city
        district
        facebookUrl
        instagramUrl
        linkedUrl
        user {
          _id
          firstName
          lastName
          avatar
          email
        }
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`;

export const GET_AGENCY_INFO = gql`
  query GetAgencyInfo($id: String!) {
    getBlockAdminAgencyInfo(_id: $id) {
      _id
      entityId
      name
      brandName
      type
      description
      brief
      logo {
        name
        url
        size
        type
      }
      coverImage {
        name
        url
        size
        type
      }
      documents {
        name
        url
        size
        type
      }
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
      messengerIntegrationId
      widgetBundleUrl
      verificationStatus
      rejectionReasons
      rejectionNotes
    }
  }
`;
