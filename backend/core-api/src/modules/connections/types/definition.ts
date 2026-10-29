import type { IResolvedConnection } from 'erxes-api-shared/core-modules';

export type ConnectionFieldKind = 'text' | 'url' | 'select' | 'headers';

export type ConnectionCategory = 'ai';

export interface IConnectionField {
  name: string;
  label: string;
  kind: ConnectionFieldKind;
  secret: boolean;
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
  description?: string;
}

export interface IConnectionTestResult {
  ok: boolean;
  error?: string;
}

export interface IConnectionTypeDefinition {
  type: string;
  label: string;
  description: string;
  category: ConnectionCategory;
  fields: IConnectionField[];
  defaultServices: string[];
  test?: (resolved: IResolvedConnection) => Promise<IConnectionTestResult>;
}
