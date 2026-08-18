import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const BLOCK_GET_PROJECTS = gql`
  query BlockAdminGetProjects(
    $searchValue: String
    $developerId: String
    $location: BlockAdminProjectLocationInput
    $priceMin: Int
    $priceMax: Int

    $dateFilters: String
    $types: [String]
    $status: BlockAdminProjectStatus
    $isPublished: Boolean
    $locations: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    blockAdminGetProjects(
      searchValue: $searchValue
      developerId: $developerId
      location: $location
      priceMin: $priceMin
      priceMax: $priceMax
      
      dateFilters: $dateFilters
      types: $types
      status: $status
      isPublished: $isPublished
      locations: $locations
      ${GQL_CURSOR_PARAMS}
    ) {
      _id
      name
      isPublished
      shortDescription
      description
      location {
        address
        city
        district
        lat
        lng
        parcelId
      }
      verificationStatus
      status
      logo
      coverImage
      images
      bankPartners
      mainPrice
      prices {
        currency
        price
        priceType
      }
      types
      projectAmenities {
        amenities
        category
      }

      startDate
      endDate

      counts
      priceRanges
      progress
      metrics
      targets
      contacts
      links
    }
  }
`;

export const BLOCK_GET_PROJECT_DETAIL = gql`
  query BlockAdminGetProject($id: String!) {
    blockAdminGetProject(_id: $id) {
      _id
      name
      isPublished
      shortDescription
      description
      location {
        address
        city
        district
        lat
        lng
        parcelId
      }
      verificationStatus
      status
      logo
      coverImage
      images
      bankPartners
      mainPrice
      prices {
        currency
        price
        priceType
      }
      types
      projectAmenities {
        amenities
        category
      }

      startDate
      endDate

      counts
      priceRanges
      progress
      metrics
      targets
      contacts
      links
      schedules
      developerId

      isFeatured
    }
  }
`;

export const BLOCK_GET_PROJECT_LIST = gql`
  query BlockAdminGetProjects {
    blockAdminGetProjects {
      _id
      name
    }
  }
`;

export const BLOCK_GET_PROJECT_MEMBERS = gql`
  query BlockGetProjectMembers($project: String!) {
    blockGetProjectMembers(project: $project) {
      _id
      memberId
      project
      role
    }
  }
`;
