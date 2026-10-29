export type TConnectionFieldKind = 'text' | 'url' | 'select' | 'headers';

export type TConnectionScope = 'workspace' | 'personal';

export interface IConnectionField {
  name: string;
  label: string;
  kind: string;
  secret: boolean;
  required: boolean;
  placeholder?: string | null;
  options?: string[] | null;
  defaultValue?: string | null;
  description?: string | null;
}

export interface IConnectionType {
  type: string;
  label: string;
  description?: string | null;
  category: string;
  fields: IConnectionField[];
  defaultServices: string[];
}

export interface IConnection {
  _id: string;
  type: string;
  name: string;
  scope: string;
  ownerId?: string | null;
  config?: Record<string, unknown> | null;
  secretsSet: string[];
  secretsUnreadable: string[];
  services: string[];
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface IConnectionHeaderRow {
  key: string;
  value: string;
}

export interface IConnectionFormValues {
  name: string;
  scope: TConnectionScope;
  services: string[];
  fields: Record<string, string>;
  headers: Record<string, IConnectionHeaderRow[]>;
  cleared: Record<string, boolean>;
}

export interface IConnectionPayload {
  config: Record<string, unknown>;
  secrets: Record<string, string>;
}

export interface IConnectionsListData {
  connections: IConnection[];
}

export interface IConnectionsTypesData {
  connectionsTypes: IConnectionType[];
}

export interface IConnectionsServicesData {
  connectionsServices: string[];
}

export interface IConnectionsAddData {
  connectionsAdd: IConnection | null;
}

export interface IConnectionsAddVariables {
  input: {
    type: string;
    name: string;
    scope: TConnectionScope;
    config: Record<string, unknown>;
    secrets: Record<string, string>;
    services?: string[];
  };
}

export interface IConnectionsEditData {
  connectionsEdit: IConnection | null;
}

export interface IConnectionsEditVariables {
  _id: string;
  input: {
    name: string;
    config: Record<string, unknown>;
    secrets: Record<string, string>;
    services?: string[];
  };
}

export interface IConnectionsRemoveData {
  connectionsRemove: boolean | null;
}

export interface IConnectionsRemoveVariables {
  _id: string;
}

export interface IConnectionsTestData {
  connectionsTest: { ok: boolean; error?: string | null } | null;
}

export interface IConnectionsTestVariables {
  _id: string;
}
