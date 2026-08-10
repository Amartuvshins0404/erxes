import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { executeErxesOperation } from './erxesTools';
import type { OperationMeta, OperationRegistry } from './operationRegistry';
import { isOperationAllowed, type ToolPolicy } from './scope';
import {
  destructiveApprovalRequiredResult,
  isApprovedOperation,
  isDestructiveOperation,
} from './destructiveGuard';
import {
  isSecurityBlockedOperation,
  securityBlockedResult,
} from './securityGuard';
import { redactSecrets } from './secretRedaction';
import {
  getCurrentAuth,
  runMutationSerially,
  runToolOnce,
} from '../requestContext';
import { makeAgentProcessId, type AgentActionInput } from '../auditLog';

function coerceArgs(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
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
  registry: OperationRegistry;
  policy: ToolPolicy;
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
  registry,
  policy,
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

  if (isDestructiveOperation(operation)) {
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
  const execute = () =>
    executeErxesOperation(operation, callArgs, registry, processId);
  const result = await runToolOnce(operationName, { args: callArgs }, () =>
    isMutation ? runMutationSerially(execute) : execute(),
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
export function buildErxesSupportTools() {
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

  // Every destructive mutation asks for approval; the agent config cannot bypass this.
  return { request_approval: requestApproval };
}
