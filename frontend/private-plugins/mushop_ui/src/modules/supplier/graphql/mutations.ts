import { gql } from '@apollo/client';

export const MUSHOP_UPDATE_SUPPLIER_VERIFICATION_STATUS = gql`
  mutation MushopUpdateSupplierVerificationStatus(
    $_id: String!
    $verificationStatus: String!
    $note: String
  ) {
    mushopUpdateSupplierVerificationStatus(
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

export const MUSHOP_UPDATE_SUPPLIER_MUSHOP_POS = gql`
  mutation MushopUpdateSupplierMushopPos($_id: String!, $mushopPosToken: String!) {
    mushopUpdateSupplierMushopPos(_id: $_id, mushopPosToken: $mushopPosToken) {
      _id
      mushopPosToken
    }
  }
`;

export const MUSHOP_UPDATE_SUPPLIER_TIER = gql`
  mutation MushopUpdateSupplierTier($_id: String!, $tierLevel: String!) {
    mushopUpdateSupplierTier(_id: $_id, tierLevel: $tierLevel) {
      _id
      tierLevel
    }
  }
`;
