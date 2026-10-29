import { gql } from '@apollo/client';

const CONNECTION_FIELDS = gql`
  fragment ConnectionsConnectionFields on Connection {
    _id
    type
    name
    scope
    ownerId
    config
    secretsSet
    secretsUnreadable
    services
    createdBy
    updatedBy
    createdAt
    updatedAt
  }
`;

export const CONNECTIONS_LIST = gql`
  query ConnectionsList {
    connections {
      ...ConnectionsConnectionFields
    }
  }
  ${CONNECTION_FIELDS}
`;

export const CONNECTIONS_TYPES = gql`
  query ConnectionsTypes {
    connectionsTypes {
      type
      label
      description
      category
      defaultServices
      fields {
        name
        label
        kind
        secret
        required
        placeholder
        options
        defaultValue
        description
      }
    }
  }
`;

export const CONNECTIONS_SERVICES = gql`
  query ConnectionsServices {
    connectionsServices
  }
`;

export const CONNECTIONS_ADD = gql`
  mutation ConnectionsAdd($input: ConnectionInput!) {
    connectionsAdd(input: $input) {
      ...ConnectionsConnectionFields
    }
  }
  ${CONNECTION_FIELDS}
`;

export const CONNECTIONS_EDIT = gql`
  mutation ConnectionsEdit($_id: String!, $input: ConnectionEditInput!) {
    connectionsEdit(_id: $_id, input: $input) {
      ...ConnectionsConnectionFields
    }
  }
  ${CONNECTION_FIELDS}
`;

export const CONNECTIONS_REMOVE = gql`
  mutation ConnectionsRemove($_id: String!) {
    connectionsRemove(_id: $_id)
  }
`;

export const CONNECTIONS_TEST = gql`
  mutation ConnectionsTest($_id: String!) {
    connectionsTest(_id: $_id) {
      ok
      error
    }
  }
`;
