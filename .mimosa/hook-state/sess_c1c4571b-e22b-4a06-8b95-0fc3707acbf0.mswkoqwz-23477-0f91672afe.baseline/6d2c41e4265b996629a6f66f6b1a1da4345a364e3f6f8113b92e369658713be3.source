import { gql } from '@apollo/client';
import {
  GQL_CURSOR_PARAM_DEFS,
  GQL_CURSOR_PARAMS,
  GQL_PAGE_INFO,
} from 'erxes-ui';

export const GET_ADMIN_LISTINGS = gql`
  query GetBlockAdminListings(
    $subdomain: String
    $status: String
    $searchValue: String
    $city: String
    $district: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    getBlockAdminListings(
      subdomain: $subdomain
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
  query GetBlockAdminListing($_id: String!) {
    getBlockAdminListing(_id: $_id) {
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
  query GetBlockAdminListingStats($subdomain: String) {
    getBlockAdminListingStats(subdomain: $subdomain) {
      total
      active
      draft
      totalViews
    }
  }
`;
