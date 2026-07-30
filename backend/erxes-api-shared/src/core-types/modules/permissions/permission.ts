export type PermissionScope = 'own' | 'group' | 'all';
export type PermissionPrincipalType = 'human' | 'agent';

export interface IPermissionAction {
  title: string;
  name: string;
  description: string;
  oauthScope?: string;
  oauthScopes?: string[];
  always?: boolean;
  disabled?: boolean;
  type?: 'resolver' | 'custom';
  agentCallable?: boolean;
}

export interface IPermissionScope {
  name: PermissionScope;
  description: string;
}

export interface IPermissionModule {
  name: string;
  description?: string;
  scopes: IPermissionScope[];
  scopeField?: string | null;
  ownerFields?: string[];
  actions: IPermissionAction[];
  always?: boolean;
}

export interface IPermissionGroupPermission {
  plugin: string;
  module: string;
  actions: string[];
  scope: PermissionScope;
}

export interface IDefaultPermissionGroup {
  id: string;
  name: string;
  description: string;
  principalType?: PermissionPrincipalType;
  permissions: IPermissionGroupPermission[];
}

export interface IPermissionConfig {
  plugin: string;
  modules: IPermissionModule[];

  defaultGroups?: IDefaultPermissionGroup[];
}

export interface IPermissionGroup {
  name: string;
  description?: string;
  principalType?: PermissionPrincipalType;
  permissions: IPermissionGroupPermission[];
}

export interface IPermissionGroupDocument extends IPermissionGroup, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface IPermissionInput {
  module: string;
  actions: string[];
  scope: PermissionScope;
}
