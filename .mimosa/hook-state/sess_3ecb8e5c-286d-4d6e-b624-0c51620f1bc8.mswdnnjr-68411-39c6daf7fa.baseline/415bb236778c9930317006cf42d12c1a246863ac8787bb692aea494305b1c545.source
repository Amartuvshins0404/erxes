import { gql } from '@apollo/client';

export const BTK_GET_COMPANY_INFO = gql`
  query GetCompanyInfo($_id: String!) {
    getCompanyInfo(_id: $_id) {
      _id
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

export const BTK_GET_COMPANY_LIST = gql`
  query GetCompanyCompanies {
    getCompanyCompanies {
      _id
      name
    }
  }
`;

export const BTK_GET_COMPANIES = gql`
  query GetCompanyCompanies {
    getCompanyCompanies {
      _id
      name
      coverImage
      address
      verificationStatus
    }
  }
`;
