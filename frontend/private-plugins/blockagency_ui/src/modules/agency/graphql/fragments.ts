import { gql } from '@apollo/client';

// Shared by `GetAgencyInfo` and `UpdateAgencyInfo` so the mutation response is
// a complete agency entity. Apollo then normalizes it into the same cache
// entry the query reads, and no refetch is needed after a save.
export const AGENCY_INFO_FIELDS = gql`
  fragment BlockAgencyInfoFields on BlockAgency {
    _id
    name
    brandName
    type
    description
    brief
    logo {
      url
      name
      type
      size
    }
    coverImage {
      url
      name
      type
      size
    }
    documents {
      url
      name
      type
      size
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
  }
`;
