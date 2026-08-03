import { createTool, type Tool } from '@mastra/core/tools';
import { z } from 'zod';
import type { AgentActionInput } from '../auditLog';
import type { DestructiveOpsPolicy } from './destructiveGuard';
import { executePolicyScopedOperation } from './metaTools';
import { getStaticOperationHints } from './operationHints';
import type { OperationMeta, OperationRegistry } from './operationRegistry';
import {
  buildZodSchemaFromArgs,
  describeSelectableFields,
  graphqlTypeToString,
} from './schemaIntrospect';
import { isOperationAllowed, type ToolPolicy } from './scope';
import { isSecurityBlockedOperation } from './securityGuard';

const RESPONSE_FIELDS_ARG = '__responseFields';

export interface BuildErxesOperationToolsParams {
  registry: OperationRegistry;
  policy: ToolPolicy;
  destructiveOps: DestructiveOpsPolicy;
  recordAction?: (entry: AgentActionInput) => void;
}

/** Name-keyed operation tools searched and auto-loaded by Mastra. */
export type ErxesOperationTools = Record<string, Tool>;

function coerceResponseFields(value: unknown): unknown {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Comma-separated model output is handled below.
  }
  return trimmed
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean);
}

function readPath(value: unknown, path: string): unknown {
  let current = value;
  for (const segment of path.split('.')) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    // The runtime object check above makes this keyed read safe.
    const record = current as Record<string, unknown>;
    current = record[segment];
  }
  return current;
}

const ACTION_SEARCH_ALIASES: Record<string, readonly string[]> = {
  add: ['create', 'new', 'make', 'insert', 'register'],
  edit: ['update', 'change', 'modify', 'set', 'rename'],
  update: ['edit', 'change', 'modify', 'set'],
  remove: ['delete', 'destroy', 'drop'],
  delete: ['remove', 'destroy', 'drop'],
  detail: ['get', 'find', 'view', 'show'],
};

function splitSearchTerms(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

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

function operationSearchTerms(operation: OperationMeta): string {
  const terms = new Set<string>([
    operation.operation,
    operation.plugin,
    operation.module,
  ]);

  for (const term of [
    ...splitSearchTerms(operation.operation),
    ...splitSearchTerms(operation.plugin),
    ...splitSearchTerms(operation.module),
  ]) {
    terms.add(term);
    const singular = singularSearchTerm(term);
    if (singular) terms.add(singular);
    for (const alias of ACTION_SEARCH_ALIASES[term] ?? []) {
      terms.add(alias);
    }
  }

  return [...terms].join(' ');
}

function operationInputSchema(
  operation: OperationMeta,
  registry: OperationRegistry,
): z.ZodTypeAny {
  const base = buildZodSchemaFromArgs(
    operation.graphqlArgs,
    registry.inputTypesMap,
    registry.enumValuesMap,
  ).extend({
    [RESPONSE_FIELDS_ARG]: z
      .preprocess(coerceResponseFields, z.array(z.string()))
      .optional()
      .describe(
        'Optional response fields. Use only fields named in this tool description; dotted paths select one nested level.',
      ),
  });
  const hints = getStaticOperationHints(operation.operation);
  const requiredPaths = hints?.required ?? [];
  const enumHints = hints?.enums ?? {};
  if (!requiredPaths.length && !Object.keys(enumHints).length) {
    return base;
  }

  return base.superRefine((value, context) => {
    for (const path of requiredPaths) {
      const current = readPath(value, path);
      if (current === undefined || current === null || current === '') {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: path.split('.'),
          message: 'Required by the server.',
        });
      }
    }
    for (const [path, allowed] of Object.entries(enumHints)) {
      const current = readPath(value, path);
      if (current !== undefined && !allowed.includes(String(current))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: path.split('.'),
          message: `Expected one of: ${allowed.join(', ')}.`,
        });
      }
    }
  });
}

function splitOperationInput(
  operation: OperationMeta,
  operationInput: Record<string, unknown>,
) {
  const requestedFields = Array.isArray(operationInput[RESPONSE_FIELDS_ARG])
    ? operationInput[RESPONSE_FIELDS_ARG].map(String)
    : undefined;
  const args = { ...operationInput };
  delete args[RESPONSE_FIELDS_ARG];

  return {
    args,
    responseFields: requestedFields?.length
      ? requestedFields
      : getStaticOperationHints(operation.operation)?.defaultResponseFields,
  };
}

function operationToolDescription(
  operation: OperationMeta,
  registry: OperationRegistry,
): string {
  const signature = (operation.graphqlArgs || [])
    .map((arg) => `${arg.name}: ${graphqlTypeToString(arg.type)}`)
    .join(', ');
  const hints = getStaticOperationHints(operation.operation);
  const argumentNames = new Set(operation.graphqlArgs.map((arg) => arg.name));
  const rules = [
    ...(hints?.rules ?? []),
    ...(argumentNames.has('limit') &&
    (argumentNames.has('cursor') || argumentNames.has('direction'))
      ? ['cursor-paginated: server rejects limit > 100; default 20']
      : []),
    ...(argumentNames.has('perPage') ? ['perPage defaults to 20'] : []),
  ];
  const required = hints?.required?.length
    ? ` Server-required fields: ${hints.required.join(', ')}.`
    : '';
  const enumRules = Object.entries(hints?.enums ?? {})
    .map(([path, values]) => `${path} = ${values.join(' | ')}`)
    .join('; ');
  const selectable = describeSelectableFields(
    operation.returnType,
    registry.objectFieldsMap,
  );
  const searchTerms = operationSearchTerms(operation);
  const defaults = hints?.defaultResponseFields;

  return [
    `${hints?.purpose || operation.description || operation.operation} (${
      operation.operationType
    } in ${operation.plugin}/${operation.module}).`,
    `Search terms: ${searchTerms}.`,
    `Exact signature: ${operation.operation}(${signature}). Call this tool directly with those arguments.`,
    required,
    enumRules ? ` Allowed values: ${enumRules}.` : '',
    rules.length ? ` Rules: ${rules.join('; ')}.` : '',
    defaults?.length ? ` Default response fields: ${defaults.join(', ')}.` : '',
    selectable
      ? ` Optional ${RESPONSE_FIELDS_ARG} menu: ${JSON.stringify(selectable)}.`
      : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Builds one exact-schema Mastra tool per permitted GraphQL operation. The
 * processor searches these descriptions and auto-loads only the best matches.
 */
export function buildErxesOperationTools({
  registry,
  policy,
  destructiveOps,
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
      description: operationToolDescription(operation, registry),
      inputSchema: operationInputSchema(operation, registry),
      outputSchema: z.unknown(),
      execute: async (input) => {
        // Mastra validates this value against operationInputSchema first.
        const call = splitOperationInput(
          operation,
          input as Record<string, unknown>,
        );

        return executePolicyScopedOperation({
          operation,
          args: call.args,
          responseFields: call.responseFields,
          registry,
          policy,
          destructiveOps,
          recordAction,
        });
      },
    });
  }

  return tools;
}
