import { gql } from '@apollo/client';
import {
  GQL_CURSOR_PARAM_DEFS,
  GQL_CURSOR_PARAMS,
  GQL_PAGE_INFO,
} from 'erxes-ui';

export const GET_ADMIN_LISTINGS = gql`
  query GetBlockAdminAgencyListings(
    $subdomain: String
    $agencyId: String
    $status: String
    $searchValue: String
    $city: String
    $district: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    getBlockAdminAgencyListings(
      subdomain: $subdomain
      agencyId: $agencyId
      status: $status
      searchValue: $searchValue
      city: $city
      district: $district
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        entityId
        subdomain
        title
        type
        propertyType
        status
        featuredImg
        viewCount
        isFeatured
        pricing {
          amount
          currency
          priceType
        }
        location {
          city
          district
        }
        specs{
          area
          floor
          totalFloors
          rooms
          builtYear
        }
        createdAt
        agent {
          _id
          firstName
          lastName
          email
        }
        agencyId
      }
      ${GQL_PAGE_INFO}
      totalCount
    }
  }
`;

export const GET_ADMIN_LISTING_DETAIL = gql`
  query GetBlockAdminAgencyListing($_id: String!) {
    getBlockAdminAgencyListing(_id: $_id) {
      _id
      entityId
      subdomain
      title
      type
      propertyType
      status
      description
      featuredImg
      viewCount
      isFeatured
      pricing {
        amount
        currency
        priceType
      }
      mediaAttachments
      location {
        city
        district
        subDistrict
        short
      }
      specs {
        area
        floor
        totalFloors
        rooms
        builtYear
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ADMIN_LISTING_STATS = gql`
  query GetBlockAdminAgencyListingStats($subdomain: String) {
    getBlockAdminAgencyListingStats(subdomain: $subdomain) {
      total
      active
      draft
      totalViews
    }
  }
`;
