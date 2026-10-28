import { gql } from '~/gql';

export const ADD_BOARD = gql(`
  mutation salesBoardsAdd($name: String!, $sharedEntityIds: [String]) {
    salesBoardsAdd(name: $name, sharedEntityIds: $sharedEntityIds) {
      _id
    }
  }
`);

export const EDIT_BOARD = gql(`
  mutation salesBoardsEdit(
    $_id: String!
    $name: String!
    $sharedEntityIds: [String]
  ) {
    salesBoardsEdit(_id: $_id, name: $name, sharedEntityIds: $sharedEntityIds) {
      _id
      name
      sharedEntityIds
    }
  }
`);

export const REMOVE_BOARD = gql(`
  mutation salesBoardsRemove($_id: String!) {
    salesBoardsRemove(_id: $_id)
  }
`);

export const SALES_BOARDS_ARCHIVE = gql(`
  mutation SalesBoardsArchive(
    $_id: String!
    $acknowledgeAutomations: Boolean
    $acknowledgeConnections: Boolean
  ) {
    salesBoardsArchive(
      _id: $_id
      acknowledgeAutomations: $acknowledgeAutomations
      acknowledgeConnections: $acknowledgeConnections
    ) {
      _id
      status
    }
  }
`);

export const SALES_BOARDS_UNARCHIVE = gql(`
  mutation SalesBoardsUnarchive($_id: String!) {
    salesBoardsUnarchive(_id: $_id) {
      _id
      status
    }
  }
`);
