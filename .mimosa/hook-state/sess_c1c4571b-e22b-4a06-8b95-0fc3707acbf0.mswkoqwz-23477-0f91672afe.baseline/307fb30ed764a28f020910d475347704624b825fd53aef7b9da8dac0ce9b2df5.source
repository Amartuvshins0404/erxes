import { gql } from '@apollo/client';

export const BLOCK_GET_UNITS = gql`
  query BlockAdminGetUnits($zoning: String!) {
    blockAdminGetUnits(zoning: $zoning) {
      _id
      number
      type
      status
      isFeatured
      agencyEntityId
      agencySubdomain
    }
  }
`;

export const BLOCK_GET_UNIT = gql`
  query BlockAdminGetUnit($id: String!) {
    blockAdminGetUnit(_id: $id) {
      _id
      building
      number
      type
      updatedAt
      zoning
      status
      isFeatured
    }
  }
`;

export const BLOCK_UNIT_ATTACHMENTS = gql`
  query BlockAdminGetAttachments($itemType: String!, $itemId: String!) {
    blockAdminGetAttachments(itemType: $itemType, itemId: $itemId) {
      _id
      attachment
    }
  }
`;

export const BLOCK_GET_UNIT_TYPES = gql`
  query BlockAdminGetUnitTypes($project: String) {
    blockAdminGetUnitTypes(project: $project) {
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
  query BlockAdminGetUnitType($id: String!) {
    blockAdminGetUnitType(_id: $id) {
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
