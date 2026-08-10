import { OperationMeta } from './operationRegistry';
import { ApprovedOp } from '../requestContext';

// erxes mutation names are suffix-based: customersRemove, dealsRemove,
// segmentsDelete, customersMerge, companiesMerge. Match those verbs anywhere in
// the operation name. We gate only mutations, so reads are never affected.
const DESTRUCTIVE_NAME = /(remove|delete|merge|destroy)/i;

/** True when `op` is a mutation that irreversibly destroys or merges data. */
export function isDestructiveOperation(op: OperationMeta): boolean {
  if (op.operationType !== 'mutation') return false;
  return DESTRUCTIVE_NAME.test(op.operation);
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
