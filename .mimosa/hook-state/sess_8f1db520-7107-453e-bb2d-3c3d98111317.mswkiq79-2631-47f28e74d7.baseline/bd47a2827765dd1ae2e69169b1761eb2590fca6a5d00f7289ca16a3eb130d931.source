import { gql } from '@apollo/client';

export const BA_UPDATE_SUPPLIER_VERIFICATION_STATUS = gql`
  mutation BaUpdateSupplierVerificationStatus(
    $_id: String!
    $verificationStatus: String!
    $note: String
  ) {
    baUpdateSupplierVerificationStatus(
      _id: $_id
      verificationStatus: $verificationStatus
      note: $note
    ) {
      _id
      verificationStatus
      verificationNote
    }
  }
`;

export const BA_UPDATE_SUPPLIER_TIER = gql`
  mutation BaUpdateSupplierTier($_id: String!, $tierLevel: Int!) {
    baUpdateSupplierTier(_id: $_id, tierLevel: $tierLevel) {
      _id
      tierLevel
    }
  }
`;
