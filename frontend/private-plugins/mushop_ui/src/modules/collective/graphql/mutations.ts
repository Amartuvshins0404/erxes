import { gql } from '@apollo/client';

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
