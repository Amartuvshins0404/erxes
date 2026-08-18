import { gql } from '@apollo/client';

export const BLOCK_GET_BUILDING_LIST = gql`
  query BlockGetBuildings($project: String!) {
    blockGetBuildings(project: $project) {
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

export const BLOCK_GET_BUILDING = gql`
  query BlockGetBuilding($_id: String!) {
    blockGetBuilding(_id: $_id) {
      _id
      name
    }
  }
`;

export const BLOCK_GET_BUILDING_ZONING = gql`
  query BlockGetBuildingZoning($_id: String!) {
    blockGetBuildingZoning(_id: $_id) {
      _id
      floor
      areaType
    }
  }
`;

export const BLOCK_GET_BUILDING_ZONINGS = gql`
  query BlockGetBuildingZonings($building: String!) {
    blockGetBuildingZonings(building: $building) {
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
