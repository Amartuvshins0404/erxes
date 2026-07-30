import { gql } from '@apollo/client';

export const DEPLOY_AGENT = gql`
  mutation deployAgent($identifierId: String!, $input: DeployAgentInput!) {
    deployAgent(identifierId: $identifierId, input: $input) {
      _id
      identifierId
      name
      url
      token
      agentId
      serverId
      createdAt
      updatedAt
    }
  }
`;

export const DEPLOY_MANAGED_AGENT = gql`
  mutation DeployManagedAgent(
    $identifierId: String!
    $input: DeployManagedAgentInput!
  ) {
    deployManagedAgent(identifierId: $identifierId, input: $input) {
      _id
      identifierId
      name
      url
      token
      agentId
      serverId
      status
      provisioning {
        stage
        message
        startedAt
        updatedAt
        error
      }
      createdAt
      updatedAt
    }
  }
`;

export const APPROVE_AGENT = gql`
  mutation ApproveAgent($identifierId: String!, $input: ApproveAgentInput!) {
    approveAgent(identifierId: $identifierId, input: $input) {
      _id
      identifierId
      name
      url
      token
      agentId
      serverId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_AGENT_FILE = gql`
  mutation UpdateAgentFile($input: UpdateAgentFileInput!) {
    updateAgentFile(input: $input)
  }
`;

export const TRANSFER_AGENT = gql`
  mutation TransferAgent($identifierId: String!, $input: TransferAgentInput!) {
    transferAgent(identifierId: $identifierId, input: $input) {
      _id
      identifierId
      name
      url
      token
      agentId
      serverId
      status
      transferredFromSubdomain
      transferredAt
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_AGENT_TRANSFER_CREDENTIALS = gql`
  mutation CreateAgentTransferCredentials($identifierId: String!) {
    createAgentTransferCredentials(identifierId: $identifierId) {
      kind
      sourceSubdomain
      serverName
      serverUrl
      gatewayToken
      agentId
      serverId
      status
    }
  }
`;

export const DESTROY_AGENT = gql`
  mutation DestroyAgent($identifierId: String!) {
    destroyAgent(identifierId: $identifierId) {
      _id
      identifierId
      name
      url
      token
      agentId
      serverId
      createdAt
      updatedAt
    }
  }
`;
