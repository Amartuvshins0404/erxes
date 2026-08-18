import { gql } from '@apollo/client';

export const UPDATE_Company_INFO = gql`
  mutation UpdateCompanyInfo($_id: String!, $input: CompanyInput) {
    updateCompanyInfo(_id: $_id, input: $input) {
      _id
    }
  }
`;

export const BTK_UPDATE_COMPANY_VERIFICATION_STATUS = gql`
  mutation BtkAdminUpdateCompanyVerificationStatus(
    $_id: String!
    $verificationStatus: CompanyVerificationStatus!
  ) {
    btkAdminUpdateCompanyVerificationStatus(
      _id: $_id
      verificationStatus: $verificationStatus
    ) {
      _id
      verificationStatus
    }
  }
`;

