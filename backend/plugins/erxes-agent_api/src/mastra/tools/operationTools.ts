import { createTool, type Tool } from '@mastra/core/tools';
import { z } from 'zod';
import type { AgentActionInput } from '../auditLog';
import { executePolicyScopedOperation } from './metaTools';
import type { OperationMeta, OperationRegistry } from './operationRegistry';
import {
  buildZodSchemaFromArgs,
  graphqlTypeToString,
} from './schemaIntrospect';
import { isOperationAllowed, type ToolPolicy } from './scope';
import { isSecurityBlockedOperation } from './securityGuard';
import { splitCamelWords } from '~/mastra/text';

export interface BuildErxesOperationToolsParams {
  registry: OperationRegistry;
  policy: ToolPolicy;
  recordAction?: (entry: AgentActionInput) => void;
}

/** Name-keyed operation tools searched and auto-loaded by Mastra. */
export type ErxesOperationTools = Record<string, Tool>;

const CRUD_SEARCH_ALIASES: Record<string, readonly string[]> = {
  add: ['create'],
  create: ['add'],
  edit: ['update'],
  update: ['edit'],
  remove: ['delete'],
  delete: ['remove'],
};

function singularSearchTerm(term: string): string | undefined {
  if (term.length > 4 && term.endsWith('ies')) {
    return `${term.slice(0, -3)}y`;
  }
  if (
    term.length > 3 &&
    term.endsWith('s') &&
    !term.endsWith('ss') &&
    !term.endsWith('us') &&
    !term.endsWith('is')
  ) {
    return term.slice(0, -1);
  }
  return undefined;
}

/** Add only live operation-name terms that common requests are likely to use. */
export function operationSearchTerms(operation: string): string {
  const terms = new Set<string>([operation]);

  for (const word of splitCamelWords(operation)) {
    const term = word.toLowerCase();
    terms.add(term);
    const singular = singularSearchTerm(term);
    if (singular) terms.add(singular);
    for (const alias of CRUD_SEARCH_ALIASES[term] ?? []) terms.add(alias);
  }

  return [...terms].join(' ');
}

function operationToolDescription(operation: OperationMeta): string {
  const signature = operation.graphqlArgs
    .map((arg) => `${arg.name}: ${graphqlTypeToString(arg.type)}`)
    .join(', ');
  const description = (
    operation.description.trim() || operation.operation
  ).slice(0, 160);
  const searchTerms = operationSearchTerms(operation.operation);

  return `${description} (${operation.operationType} in ${operation.plugin}/${operation.module}). Search terms: ${searchTerms}. Exact GraphQL operation: ${operation.operation}(${signature}).`;
}

/**
 * Builds one exact-schema Mastra tool per permitted GraphQL operation. Mastra
 * searches the live operation name, plugin, module, and schema description.
 */
export function buildErxesOperationTools({
  registry,
  policy,
  recordAction,
}: BuildErxesOperationToolsParams): ErxesOperationTools {
  const tools: ErxesOperationTools = {};

  for (const operation of registry.list) {
    if (
      !isOperationAllowed(operation, policy) ||
      isSecurityBlockedOperation(operation.operation)
    ) {
      continue;
    }

    tools[operation.operation] = createTool({
      id: operation.operation,
      description: operationToolDescription(operation),
      inputSchema: buildZodSchemaFromArgs(
        operation.graphqlArgs,
        registry.inputTypesMap,
        registry.enumValuesMap,
      ),
      outputSchema: z.unknown(),
      execute: async (input) =>
        executePolicyScopedOperation({
          operation,
          args: input as Record<string, unknown>,
          registry,
          policy,
          recordAction,
        }),
    });
  }

  return tools;
}
