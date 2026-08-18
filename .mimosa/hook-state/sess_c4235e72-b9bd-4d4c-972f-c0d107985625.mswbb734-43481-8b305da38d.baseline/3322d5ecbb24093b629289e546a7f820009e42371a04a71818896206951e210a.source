import { gql } from '@apollo/client';

export const BLOCK_CREATE_BUILDING = gql`
  mutation BlockCreateBuilding($input: BlockBuildingInput!) {
    blockCreateBuilding(input: $input) {
      _id
    }
  }
`;

export const BLOCK_UPDATE_BUILDING = gql`
  mutation BlockUpdateBuilding($id: String!, $input: BlockBuildingInput!) {
    blockUpdateBuilding(_id: $id, input: $input) {
      _id
    }
  }
`;

export const BLOCK_CREATE_BUILDING_ZONING = gql`
  mutation BlockCreateBuildingZoning($input: BlockBuildingZoningInput!) {
    blockCreateBuildingZoning(input: $input) {
      _id
    }
  }
`;

export const BLOCK_UPDATE_BUILDING_ZONING = gql`
  mutation BlockUpdateBuildingZoning(
    $id: String!
    $input: BlockBuildingZoningInput!
  ) {
    blockUpdateBuildingZoning(_id: $id, input: $input) {
      _id
    }
  }
`;

export const BLOCK_REMOVE_BUILDINGS = gql`
  mutation BlockRemoveBuildings($ids: [String!]!) {
    blockRemoveBuildings(ids: $ids)
  }
`;

export const BLOCK_DELETE_BUILDING_ZONING = gql`
  mutation BlockDeleteBuildingZoning($id: String!) {
    blockDeleteBuildingZoning(_id: $id) {
      _id
    }
  }
`;
