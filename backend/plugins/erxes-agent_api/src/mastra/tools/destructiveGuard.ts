import type { AgentToolDescriptor } from 'erxes-api-shared/utils';
import { ApprovedOp } from '../requestContext';

// Destructive capabilities irreversibly destroy or merge data. Model tools
// mark remove ops directly; tRPC mutations are matched on the remove/delete/
// merge/destroy verbs in their id — the same verb gate the GraphQL operation
// names used. We gate only mutations, so reads are never affected.
const DESTRUCTIVE_NAME = /(remove|delete|merge|destroy)/i;

/** True when `tool` irreversibly destroys or merges data. */
export function isDestructiveTool(tool: AgentToolDescriptor): boolean {
  if (tool.method !== 'mutation') return false;
  if (tool.kind === 'model') return tool.op === 'remove';
  return DESTRUCTIVE_NAME.test(tool.id);
}

/**
 * True when the user approved this operation for the turn. Matched on operation
 * name only — the user approves the action, so argument changes do not trigger
 * a second prompt.
 */
export function isApprovedOperation(
  operation: string,
  approved: ApprovedOp[] | undefined,
): boolean {
  if (!approved?.length) return false;
  return approved.some((a) => a.operation === operation);
}

/**
 * The structured result returned when the model attempts a destructive
 * operation that the user has not yet approved. The agent must not retry.
 */
export function destructiveApprovalRequiredResult(
  operation: string,
  args: Record<string, unknown>,
) {
  return {
    success: false,
    requiresApproval: true,
    operation,
    args,
    error: `Operation "${operation}" deletes or merges data and needs the user's approval.`,
    instruction:
      'Do NOT retry this operation and take no other action this turn. Reply with ' +
      'ONE short question asking the user to confirm, naming exactly what will be ' +
      'affected (for example: "Delete these 7 products?"). Do NOT mention buttons, ' +
      'approval, or that they will be prompted — just ask the question. The ' +
      'operation runs automatically once they approve.',
  };
}
