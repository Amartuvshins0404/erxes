import { gql } from '@apollo/client';

export const AGENTS_AI_CONNECTIONS = gql`
  query AgentsAiConnections {
    connections(category: "ai") {
      _id
      name
      type
      scope
      secretsUnreadable
    }
  }
`;

export const AGENTS_MODELS = gql`
  query AgentsModels {
    agentsModels {
      connectionId
      connectionName
      provider
      scope
      isDefault
      models
      catalog {
        id
        family
        recommended
        name
        thinking {
          kind
          levels
        }
      }
      error
    }
  }
`;

export const AGENTS_SET_DEFAULT_CONNECTION = gql`
  mutation AgentsSetDefaultConnection($connectionId: String) {
    agentsSetDefaultConnection(connectionId: $connectionId)
  }
`;

export const AGENTS_MODEL_VERIFY = gql`
  mutation AgentsModelVerify($connectionId: String!, $model: String!) {
    agentsModelVerify(connectionId: $connectionId, model: $model) {
      ok
      error
    }
  }
`;

export interface IAgentsAiConnection {
  _id: string;
  name: string;
  type: string;
  scope: string;
  secretsUnreadable: string[];
}

export interface IAgentsAiConnectionsData {
  connections: IAgentsAiConnection[] | null;
}

export type IAgentsModelThinkingKind =
  | 'effort'
  | 'toggle'
  | 'budget'
  | 'fixed'
  | 'none';

export interface IAgentsModelThinkingData {
  kind: string | null;
  levels: string[] | null;
}

export interface IAgentsModelInfo {
  id: string;
  family: string | null;
  recommended: boolean | null;
  name?: string | null;
  thinking?: IAgentsModelThinkingData | null;
}

export interface IAgentsProviderModels {
  connectionId: string;
  connectionName: string;
  provider: string;
  scope: string;
  isDefault: boolean | null;
  models: string[] | null;
  catalog: IAgentsModelInfo[] | null;
  error: string | null;
}

export interface IAgentsModelsData {
  agentsModels: IAgentsProviderModels[] | null;
}

export interface IAgentsSetDefaultConnectionData {
  agentsSetDefaultConnection: boolean | null;
}

export interface IAgentsSetDefaultConnectionVariables {
  connectionId?: string;
}

export interface IAgentsModelVerifyData {
  agentsModelVerify: {
    ok: boolean | null;
    error: string | null;
  } | null;
}

export interface IAgentsModelVerifyVariables {
  connectionId: string;
  model: string;
}
