import { gql } from '@apollo/client';
import { SUPPLIER_FRAGMENT } from './queries';

export const UPDATE_GET_SUPPLIER = gql`
  mutation SupplierUpdateProfile($input: SupplierInput!) {
    supplierUpdateProfile(input: $input) {
      ...SupplierFields
    }
  }
  ${SUPPLIER_FRAGMENT}
`;
