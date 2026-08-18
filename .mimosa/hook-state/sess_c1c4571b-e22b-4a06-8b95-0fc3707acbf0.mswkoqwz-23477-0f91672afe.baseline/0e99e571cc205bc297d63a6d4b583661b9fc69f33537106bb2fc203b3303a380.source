import { gql } from '@apollo/client';

export const DEPLOY_OPENCODE = gql`
  mutation DeployOpencode($identifierId: String!, $input: DeployOpencodeInput!) {
    deployOpencode(identifierId: $identifierId, input: $input) {
      _id
      identifierId
      name
      url
      provider
      serverId
      createdAt
      updatedAt
      status
    }
  }
`;

export const TRANSFER_OPENCODE = gql`
  mutation TransferOpencode($identifierId: String!, $input: TransferOpencodeInput!) {
    transferOpencode(identifierId: $identifierId, input: $input) {
      _id
      identifierId
      name
      url
      token
      provider
      serverId
      createdAt
      updatedAt
      status
      transferredFromSubdomain
      transferredAt
    }
  }
`;

export const CREATE_OPENCODE_TRANSFER_CREDENTIALS = gql`
  mutation CreateOpencodeTransferCredentials($identifierId: String!) {
    createOpencodeTransferCredentials(identifierId: $identifierId) {
      kind
      sourceSubdomain
      serverName
      serverUrl
      gatewayToken
      provider
      serverId
      serverPassword
      status
    }
  }
`;

export const DESTROY_OPENCODE = gql`
  mutation DestroyOpencode($identifierId: String!) {
    destroyOpencode(identifierId: $identifierId) {
      _id
      identifierId
      name
      url
      provider
      serverId
      createdAt
      updatedAt
      status
    }
  }
`;
