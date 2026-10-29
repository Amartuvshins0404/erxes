import { AI_CONNECTION_TYPES } from './ai';
import type { IConnectionTypeDefinition } from './definition';

export * from './definition';

const CONNECTION_TYPES: IConnectionTypeDefinition[] = [...AI_CONNECTION_TYPES];

export const listConnectionTypes = (
  category?: string | null,
): IConnectionTypeDefinition[] =>
  category
    ? CONNECTION_TYPES.filter((definition) => definition.category === category)
    : CONNECTION_TYPES;

export const getConnectionType = (
  type: string,
): IConnectionTypeDefinition | undefined =>
  CONNECTION_TYPES.find((definition) => definition.type === type);
