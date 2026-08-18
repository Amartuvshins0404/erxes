import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const BA_SUPPLIERS = gql`
  query BaSuppliers(
    $verificationStatus: String
    $searchValue: String
    $city: String
    $district: String
    $dateFilters: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    baSuppliers(
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

export const BA_SUPPLIER_DETAIL = gql`
  query BaSupplierDetail($_id: String!) {
    baSupplierDetail(_id: $_id) {
      _id
      name
      code
      description
      about
      logo
      coverImage
      attachments
      urls
      registrationNumber
      industry
      address
      primaryEmail
      primaryPhone
      emails
      phones
      dateFounded
      website
      verificationStatus
      tierLevel
      socialLinks {
        facebook
        twitter
        instagram
        linkedin
        youtube
        website
      }
      posToken
      createdAt
      updatedAt
    }
  }
`;
