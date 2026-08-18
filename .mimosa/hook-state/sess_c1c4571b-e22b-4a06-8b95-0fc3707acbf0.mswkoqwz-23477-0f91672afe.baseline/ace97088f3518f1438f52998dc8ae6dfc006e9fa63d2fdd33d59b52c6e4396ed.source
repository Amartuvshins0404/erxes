import { gql } from '@apollo/client';

export const BTK_GET_COMPANY_INFO = gql`
  query BtkAdminCompanyInfo($_id: String) {
    btkAdminCompanyInfo(_id: $_id) {
      _id
      entityId
      name
      description
      about
      logo
      website
      address
      dateFounded
      email
      primaryPhone
      coverImage
      phones
      socialLinks {
        facebook
        twitter
        instagram
        linkedin
        youtube
        website
      }
      verificationStatus
    }
  }
`;

export const BTK_GET_COMPANIES = gql`
  query BtkAdminCompanies {
    btkAdminCompanies {
      _id
      name
      logo
      coverImage
      address
      verificationStatus
    }
  }
`;

export const BTK_GET_COMPANY_LIST = gql`
  query BtkAdminCompanies {
    btkAdminCompanies {
      _id
      name
    }
  }
`;
