import { gql } from '@apollo/client';

export const MUSHOP_CREATE_COLLECTIVE = gql`
  mutation MushopCreateCollective(
    $targetSubdomain: String!
    $supplierIds: [String!]!
  ) {
    mushopCreateCollective(
      targetSubdomain: $targetSubdomain
      supplierIds: $supplierIds
    ) {
      _id
      targetSubdomain
      supplierIds
      status
    }
  }
`;

export const MUSHOP_RESYNC_COLLECTIVE = gql`
  mutation MushopResyncCollective($_id: String!, $supplierIds: [String!]) {
    mushopResyncCollective(_id: $_id, supplierIds: $supplierIds) {
      _id
      status
    }
  }
`;

export const MUSHOP_UPDATE_COLLECTIVE_SUPPLIERS = gql`
  mutation MushopUpdateCollectiveSuppliers(
    $_id: String!
    $supplierIds: [String!]!
  ) {
    mushopUpdateCollectiveSuppliers(_id: $_id, supplierIds: $supplierIds) {
      _id
      supplierIds
      suppliers {
        _id
        name
        logo
        verificationStatus
      }
      status
    }
  }
`;
