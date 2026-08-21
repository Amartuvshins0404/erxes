// Empty-operation-result normalization.
//
// Several erxes resolvers answer a zero-match read with a bare `{}` (for
// example posOrdersSummary) or `[]`/`null`. Handed to the model verbatim, an
// anonymous empty payload is indistinguishable from a swallowed error — the
// model then retries the same call with cosmetic argument changes instead of
// questioning its filters. Wrapping the empty case in an explicit envelope
// gives the model three facts it cannot infer from `{}`: the call SUCCEEDED,
// it matched ZERO records, and the next move is a filter check or a domain
// pivot — never a blind retry.
export function isEmptyOperationResult(result: unknown): boolean {
  if (result === null || result === undefined) return true;
  if (Array.isArray(result)) return result.length === 0;
  if (typeof result === 'object') {
    return Object.keys(result as Record<string, unknown>).length === 0;
  }
  return false;
}

export function withEmptyResultGuidance(result: unknown): unknown {
  if (!isEmptyOperationResult(result)) return result;

  return {
    success: true,
    resultCount: 0,
    data: result ?? null,
    message: 'The query ran successfully but matched 0 records.',
    instruction:
      'Do NOT repeat the same call with only cosmetic argument changes. ' +
      'First re-check your filters — especially the date range and year. ' +
      'If the filters are correct, pivot once to another loaded operation ' +
      'that covers the same business domain (for example deals instead of ' +
      'point-of-sale orders for a sales report). If nothing returns data, ' +
      'tell the user in plain words that no matching data exists for that ' +
      'period and ask how they want to proceed.',
  };
}
