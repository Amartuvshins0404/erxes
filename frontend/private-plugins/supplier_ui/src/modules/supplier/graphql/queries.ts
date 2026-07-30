import { gql } from '@apollo/client';

export const SUPPLIER_FRAGMENT = gql`
  fragment SupplierFields on Supplier {
    _id
    code
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
    paymentId
    verificationStatus
    verificationNote
    tierLevel
    socialLinks {
      facebook
      twitter
      instagram
      linkedin
      youtube
      website
    }
  }
`;

export const GET_SUPPLIER = gql`
  query GetSupplier {
    getSupplier {
      ...SupplierFields
    }
  }
  ${SUPPLIER_FRAGMENT}
`;
