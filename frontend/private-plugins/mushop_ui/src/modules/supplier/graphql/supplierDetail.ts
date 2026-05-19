import { gql } from '@apollo/client';

export const MUSHOP_SUPPLIER_DETAIL = gql`
  query MushopSupplierDetail($_id: String!) {
    mushopSupplierDetail(_id: $_id) {
      _id
      name
      description
      about
      logo
      coverImage
      attachments
      urls
      registrationNumber
      address
      primaryEmail
      primaryPhone
      emails
      phones
      dateFounded
      website
      verificationStatus
      tierLevel
      socialLinks {
        facebook
        twitter
        instagram
        linkedin
        youtube
        website
      }
      posToken
      mushopPosToken
      createdAt
      updatedAt
    }
  }
`;
