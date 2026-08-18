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

export const GET_AGENCY_INFO = gql`
  query GetAgencyInfo($id: String!) {
    getBlockAdminAgencyInfo(_id: $id) {
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
      messengerIntegrationId
      widgetBundleUrl
    }
  }
`;
