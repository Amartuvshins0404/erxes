import { gql } from '@apollo/client';

export const BLOCK_GET_PROJECTS = gql`
  query BlockGetProjects($filters: BlockProjectFilterInput) {
    blockGetProjects(filters: $filters) {
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
  query BlockGetProject($id: String!) {
    blockGetProject(_id: $id) {
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
    }
  }
`;

export const BLOCK_GET_PROJECT_LIST = gql`
  query BlockGetProjectsList {
    blockGetProjects {
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
