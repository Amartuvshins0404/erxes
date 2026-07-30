import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { sendTRPCMessage } from 'erxes-api-shared/utils';
import {
  executeErxesOperation,
  type ErxesToolSettings,
} from './erxesTools';
import { parseJsonPreprocess } from './schemaIntrospect';
import type { OperationMeta, OperationRegistry } from './operationRegistry';
import { isOperationAllowed, type ToolPolicy } from './scope';
import {
  destructiveApprovalRequiredResult,
  destructiveOpsPreapproved,
  isApprovedOperation,
  isDestructiveOperation,
  type DestructiveOpsPolicy,
} from './destructiveGuard';
import {
  isSecurityBlockedOperation,
  securityBlockedResult,
} from './securityGuard';
import { redactSecrets } from './secretRedaction';
import { getCurrentAuth } from '../requestContext';
import { makeAgentProcessId, type AgentActionInput } from '../auditLog';

/** Model-readable metadata used by the static operation-hint census. */
export interface ArgFieldSpec {
  name: string;
  type: string;
  required: boolean;
  enumValues?: string[];
  requiredNote?: string;
}

/** One operation argument plus its optional nested input-object shape. */
export interface ArgSpec extends ArgFieldSpec {
  description?: string;
  fields?: Array<ArgFieldSpec | string>;
}

function coerceArgs(value: unknown): Record<string, unknown> {
  const parsed =
    typeof value === 'string' ? parseJsonPreprocess(value) : value;
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

const AUDIT_ERROR_MAX = 500;

/** Compact, secret-safe error text stored for a failed mutation audit row. */
export function auditErrorMessage(result: unknown): string {
  if (!result || typeof result !== 'object') return '';
  const record = result as Record<string, unknown>;
  const error = typeof record.error === 'string' ? record.error.trim() : '';
  if (error) return error.slice(0, AUDIT_ERROR_MAX);
  const instruction =
    typeof record.instruction === 'string' ? record.instruction.trim() : '';
  if (instruction) return instruction.slice(0, AUDIT_ERROR_MAX);
  try {
    return JSON.stringify(result).slice(0, AUDIT_ERROR_MAX);
  } catch {
    return '';
  }
}

export interface ExecutePolicyScopedOperationParams {
  operation: OperationMeta;
  args: Record<string, unknown>;
  responseFields?: string[];
  settings: ErxesToolSettings | null;
  registry: OperationRegistry;
  policy: ToolPolicy;
  destructiveOps: DestructiveOpsPolicy;
  recordAction?: (entry: AgentActionInput) => void;
}

/**
 * Runs one already-discovered operation behind every erxes safety boundary.
 * Per-operation Mastra tools delegate here so typed schemas improve model calls
 * without duplicating policy, approval, audit, secret, or GraphQL behavior.
 */
export async function executePolicyScopedOperation({
  operation,
  args,
  responseFields,
  settings,
  registry,
  policy,
  destructiveOps,
  recordAction,
}: ExecutePolicyScopedOperationParams): Promise<unknown> {
  const operationName = operation.operation;
  const callArgs = coerceArgs(args);

  // Check this before policy/registry detail so blocked operations leak nothing.
  if (isSecurityBlockedOperation(operationName)) {
    recordAction?.({
      operation: operationName,
      operationType: operation.operationType,
      destructive: isDestructiveOperation(operation),
      args: redactSecrets(callArgs),
      status: 'blocked',
      error: 'security-blocked',
    });
    return securityBlockedResult();
  }

  // Defense in depth: discovery filters policy, and execution re-checks it.
  if (!isOperationAllowed(operation, policy)) {
    return {
      success: false,
      error: `Operation "${operationName}" is not permitted for this agent.`,
    };
  }

  const isMutation = operation.operationType === 'mutation';
  const background = getCurrentAuth()?.background === true;
  const destructiveAllowed = destructiveOpsPreapproved(
    destructiveOps,
    background,
  );

  if (!destructiveAllowed && isDestructiveOperation(operation)) {
    const approvedOps = getCurrentAuth()?.approvedOps;
    if (!isApprovedOperation(operationName, approvedOps)) {
      recordAction?.({
        operation: operationName,
        operationType: operation.operationType,
        destructive: true,
        args: redactSecrets(callArgs),
        status: 'blocked',
        error: 'awaiting user approval',
      });
      return destructiveApprovalRequiredResult(operationName, callArgs);
    }
  }

  const processId = isMutation ? makeAgentProcessId() : undefined;
  const result = await executeErxesOperation(
    operation,
    callArgs,
    settings,
    registry,
    processId,
    responseFields?.length ? responseFields : undefined,
  );

  if (isMutation) {
    const failed =
      result !== null &&
      typeof result === 'object' &&
      'success' in result &&
      result.success === false;
    recordAction?.({
      operation: operationName,
      operationType: operation.operationType,
      destructive: isDestructiveOperation(operation),
      args: redactSecrets(callArgs),
      status: failed ? 'failed' : 'success',
      error: failed ? auditErrorMessage(result) : undefined,
      processId,
    });
  }

  return result;
}

/** Standalone erxes helpers that remain directly bound beside tool discovery. */
export function buildErxesSupportTools(params: {
  policy: ToolPolicy;
  destructiveOps: DestructiveOpsPolicy;
}) {
  const { policy, destructiveOps } = params;

  const requestApproval = createTool({
    id: 'request_approval',
    description:
      'Ask the user to approve destructive operations (delete / merge / remove) BEFORE running them. ' +
      'Provide one short summary and the exact operations you will call after approval. This executes nothing.',
    inputSchema: z.object({
      summary: z
        .string()
        .describe('One short confirmation line shown to the user.'),
      operations: z
        .array(
          z.object({
            operation: z.string(),
            args: z.record(z.unknown()).optional(),
          }),
        )
        .describe('The destructive operations to run once approved.'),
    }),
    outputSchema: z.unknown(),
    execute: async ({ summary, operations }) => ({
      requiresApproval: true,
      summary,
      operations: operations ?? [],
    }),
  });

  const listConfigKeys = createTool({
    id: 'list_config_keys',
    description:
      'List which erxes configuration codes are currently SET (names only; values are never returned).',
    inputSchema: z.object({}),
    outputSchema: z.unknown(),
    execute: async () => {
      const subdomain = getCurrentAuth()?.subdomain || '';
      try {
        const codes = await sendTRPCMessage({
          subdomain,
          pluginName: 'core',
          module: 'configs',
          action: 'getCodes',
          method: 'query',
          input: {},
          defaultValue: null,
        });
        if (codes == null) {
          return {
            success: false,
            error: 'Could not reach the configuration service.',
            instruction:
              'Tell the user the configuration list is temporarily unavailable; do not guess what is configured.',
          };
        }
        const list = Array.isArray(codes) ? codes.map(String) : [];
        return {
          total: list.length,
          codes: list,
          note: list.length
            ? 'These configuration codes are set. Values are hidden and cannot be read. To change a config that holds a secret, send only the fields being changed.'
            : 'No configuration codes are set on this instance.',
        };
      } catch {
        return {
          success: false,
          error: 'Could not reach the configuration service.',
          instruction:
            'Tell the user the configuration list is temporarily unavailable; do not guess what is configured.',
        };
      }
    },
  });

  return {
    ...(policy.mode === 'all' ? { list_config_keys: listConfigKeys } : {}),
    ...(destructiveOps !== 'allow' ? { request_approval: requestApproval } : {}),
  };
}
