import { gql } from '@apollo/client';

export const COLLECTIVE_FRAGMENT = gql`
  fragment CollectiveFields on Collective {
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

export const GET_COLLECTIVE = gql`
  query GetCollective {
    getCollective {
      ...CollectiveFields
    }
  }
  ${COLLECTIVE_FRAGMENT}
`;

export const GET_COLLECTIVE_SUPPLIERS = gql`
  query CollectiveSuppliers {
    collectiveSuppliers {
      _id
      name
      logo
      primaryEmail
      primaryPhone
      verificationStatus
    }
  }
`;
