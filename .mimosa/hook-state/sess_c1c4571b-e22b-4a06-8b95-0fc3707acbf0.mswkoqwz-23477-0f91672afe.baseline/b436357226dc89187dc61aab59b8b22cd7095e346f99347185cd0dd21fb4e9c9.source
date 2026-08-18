import { gql } from '@apollo/client';

export const BLOCK_CREATE_UNIT = gql`
  mutation BlockCreateUnit($input: BlockUnitInput!) {
    blockCreateUnit(input: $input) {
      _id
    }
  }
`;

export const BLOCK_CREATE_UNITS = gql`
  mutation BlockCreateUnits($input: BlockUnitsInput!) {
    blockCreateUnits(input: $input) {
      _id
    }
  }
`;

export const BLOCK_UPDATE_UNIT = gql`
  mutation BlockUpdateUnit($id: String!, $input: BlockUnitInput!) {
    blockUpdateUnit(_id: $id, input: $input) {
      _id
    }
  }
`;

export const BLOCK_REMOVE_UNIT = gql`
  mutation BlockRemoveUnit($id: String!) {
    blockRemoveUnit(_id: $id) {
      _id
    }
  }
`;

export const BLOCK_REMOVE_UNITS = gql`
  mutation BlockRemoveUnits($_ids: [String]) {
    blockRemoveUnits(_ids: $_ids)
  }
`;

export const BLOCK_CREATE_UNIT_ATTACHMENT = gql`
  mutation BlockCreateAttachment($input: BlockAttachmentInput!) {
    blockCreateAttachment(input: $input) {
      _id
    }
  }
`;

export const BLOCK_UPDATE_UNIT_ATTACHMENT = gql`
  mutation BlockUpdateAttachment($id: String!, $input: BlockAttachmentInput!) {
    blockUpdateAttachment(_id: $id, input: $input) {
      _id
    }
  }
`;

export const BLOCK_REMOVE_UNIT_ATTACHMENT = gql`
  mutation BlockDeleteAttachment($id: String!) {
    blockDeleteAttachment(_id: $id) {
      _id
    }
  }
`;

export const BLOCK_TRANSFER_UNIT = gql`
  mutation BlockTransferUnit($input: BlockTransferUnitInput!) {
    blockTransferUnit(input: $input) {
      _id
      agencySubdomain
      agencyEntityId
    }
  }
`;

export const BLOCK_TOGGLE_UNIT_LOCK = gql`
  mutation BlockToggleUnitLock($id: String!, $locked: Boolean!) {
    blockToggleUnitLock(_id: $id, locked: $locked) {
      _id
      locked
    }
  }
`;

export const BLOCK_CREATE_UNIT_TYPE = gql`
  mutation BlockCreateUnitType($input: UnitTypeInput!) {
    blockCreateUnitType(input: $input) {
      _id
    }
  }
`;

export const BLOCK_UPDATE_UNIT_TYPE = gql`
  mutation BlockUpdateUnitType($id: String!, $input: UnitTypeInput!) {
    blockUpdateUnitType(_id: $id, input: $input) {
      _id
    }
  }
`;

export const BLOCK_REMOVE_UNIT_TYPE = gql`
  mutation BlockRemoveUnitType($id: String!) {
    blockRemoveUnitType(_id: $id) {
      _id
    }
  }
`;
