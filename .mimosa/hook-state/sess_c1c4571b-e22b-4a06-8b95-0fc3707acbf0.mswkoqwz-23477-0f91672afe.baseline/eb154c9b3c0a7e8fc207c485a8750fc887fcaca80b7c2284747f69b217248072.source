import { gql } from '@apollo/client';

export const BLOCK_CREATE_UNIT = gql`
  mutation BlockCreateUnit($input: BlockUnitInput!) {
    blockCreateUnit(input: $input) {
      _id
    }
  }
`;

export const BLOCK_UPDATE_UNIT = gql`
  mutation BlockAdminUpdateUnit($id: String!, $input: BlockAdminUnitInput!) {
    blockAdminUpdateUnit(_id: $id, input: $input) {
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
