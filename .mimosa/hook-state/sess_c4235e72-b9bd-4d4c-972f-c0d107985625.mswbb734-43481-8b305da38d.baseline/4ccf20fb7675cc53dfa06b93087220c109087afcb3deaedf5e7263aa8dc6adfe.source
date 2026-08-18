import { gql } from '@apollo/client';

export const BLOCK_GET_BUILDING_LIST = gql`
  query BlockAdminGetBuildings($project: String!) {
    blockAdminGetBuildings(project: $project) {
      _id
      description
      name
      types
      coverImage
      project
      status
      startDate
      endDate
    }
  }
`;

export const BLOCK_GET_BUILDING_ZONINGS = gql`
  query BlockAdminGetBuildingZonings($building: String!) {
    blockAdminGetBuildingZonings(building: $building) {
      _id
      building
      floor
      areaType
      tenureTypes
      unitsCount
      usageTypes
      size
    }
  }
`;
