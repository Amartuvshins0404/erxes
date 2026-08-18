import { gql } from '@apollo/client';

export const ADMIN_REJECT_AGENCY = gql`
  mutation BlockAdminAgencyReject(
    $agencyId: String!
    $input: BlockAdminAgencyRejectionInput!
  ) {
    blockAdminAgencyReject(agencyId: $agencyId, input: $input) {
      _id
      entityId
      name
      brandName
      type
      description
      brief
      website
      emails
      primaryEmail
      phones
      primaryPhone
      dateFounded
      logo
      coverImage
      documents
      socialLinks
      operationArea {
        city
        district
      }
      fieldsOfExpertise {
        propertyTypes
        services
        clientTypes
      }
      verificationStatus
      rejectionReasons
      rejectionNotes
    }
  }
`;

export const ADMIN_VERIFY_AGENCY = gql`
  mutation BlockAdminAgencyVerify($agencyId: String!) {
    blockAdminAgencyVerify(agencyId: $agencyId) {
      _id
      entityId
      name
      brandName
      type
      description
      brief
      website
      emails
      primaryEmail
      phones
      primaryPhone
      dateFounded
      logo
      coverImage
      documents
      socialLinks
      operationArea {
        city
        district
      }
      fieldsOfExpertise {
        propertyTypes
        services
        clientTypes
      }
      verificationStatus
      rejectionReasons
      rejectionNotes
    }
  }
`;
