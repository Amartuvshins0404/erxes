import { gql } from '@apollo/client';

export const BLOCK_GET_UNITS = gql`
  query BlockGetUnits($zoning: String, $zonings: [String]) {
    blockGetUnits(zoning: $zoning, zonings: $zonings) {
      _id
      number
      type
      unitType {
        _id
        name
        size
        price
      }
      status
      locked
      activeContract {
        _id
        status
        statusType
        statusLabel
        statusColor
      }
    }
  }
`;

export const BLOCK_GET_UNIT = gql`
  query BlockGetUnit($id: String!) {
    blockGetUnit(_id: $id) {
      _id
      building
      buildingData {
        _id
        name
      }
      number
      type
      unitType {
        _id
        name
        size
        price
      }
      updatedAt
      zoning
      zoningData {
        _id
        building
        floor
        usageTypes
        areaType
        tenureTypes
        unitsCount
        size
        priceList {
          currency
          priceType
          price
        }
      }
      status
      blockSubdomain
      blockEntityId
      agencySubdomain
      agencyEntityId
      projectData {
        _id
        name
      }
      activeContract {
        _id
        status
        statusType
        statusLabel
        statusColor
      }
      locked
    }
  }
`;

export const BLOCK_UNIT_ATTACHMENTS = gql`
  query BlockGetAttachments($itemType: String!, $itemId: String!) {
    blockGetAttachments(itemType: $itemType, itemId: $itemId) {
      _id
      attachment
    }
  }
`;

export const BLOCK_GET_UNIT_TYPES = gql`
  query BlockGetUnitTypes($project: String) {
    blockGetUnitTypes(project: $project) {
      _id
      name
      description
      size
      type
      subTypes
      featureTypes
      areaType
      tenureTypes
      content
      price
      prices {
        currency
        priceType
        price
      }
      status
      rooms
      roomsCount
      coverImage
      images
      planImages
      createdAt
      updatedAt
    }
  }
`;

export const BLOCK_GET_UNIT_TYPE = gql`
  query BlockGetUnitType($id: String!) {
    blockGetUnitType(_id: $id) {
      _id
      name
      description
      size
      type
      subTypes
      featureTypes
      areaType
      tenureTypes
      content
      price
      prices {
        currency
        priceType
        price
      }
      status
      rooms
      roomsCount
      coverImage
      images
      planImages
      createdAt
      updatedAt
    }
  }
`;
