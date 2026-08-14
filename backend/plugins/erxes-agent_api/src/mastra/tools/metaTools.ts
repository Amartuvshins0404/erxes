import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

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
