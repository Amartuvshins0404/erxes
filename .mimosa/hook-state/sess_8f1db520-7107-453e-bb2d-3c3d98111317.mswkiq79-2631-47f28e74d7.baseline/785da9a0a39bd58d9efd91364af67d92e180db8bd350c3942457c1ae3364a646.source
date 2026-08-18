import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const MUSHOP_POS_LIST = gql`
  query PosclientConfigs {
    posclientConfigs {
      _id
      name
      token
    }
  }
`;

export const MUSHOP_SUPPLIER_POS_LIST = gql`
  query MushopSupplierPosList($supplierId: String!) {
    mushopSupplierPosList(supplierId: $supplierId) {
      _id
      name
      token
    }
  }
`;

export const MUSHOP_SUPPLIERS = gql`
  query MushopSuppliers(
    $verificationStatus: String
    $searchValue: String
    $city: String
    $district: String
    $dateFilters: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    mushopSuppliers(
      verificationStatus: $verificationStatus
      searchValue: $searchValue
      city: $city
      district: $district
      dateFilters: $dateFilters
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        name
        description
        logo
        coverImage
        registrationNumber
        primaryEmail
        primaryPhone
        website
        dateFounded
        verificationStatus
        tierLevel
        address
        createdAt
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;
