// A denylist of erxes operations an AI agent must never discover or run,
// regardless of its tool policy. Unlike the destructive guard — which gates
// data-*mutating* ops behind per-turn user approval — this is an unconditional
// block on reads that expose secrets or whole-system state with no safe use
// from chat.
//
// The canonical case is the `configs` query: it returns every Config document
// (`models.Configs.find({})`) — integration credentials, payment-provider keys,
// SMTP / API secrets — in a single call, so a prompt like
// `{ operation: "configs" }` would dump the instance's entire secret store. The
// `configsByCode` / `configsGetValue` / `configsGetEnv` reads hit the same store
// (by code, or straight from the environment), so they are blocked too.
//
// Names are matched EXACTLY against the GraphQL field names from core's
// organization/settings config resolvers. We deliberately do NOT pattern-match
// "config" loosely: plenty of legitimate per-feature config operations exist
// (a plugin reading its own settings) and must stay usable.
const BLOCKED_OPERATIONS = new Set<string>([
  'configs',
  'configsByCode',
  'configsGetValue',
  'configsGetEnv',
]);

/**
 * True when an operation name is security-blocked. Blocked operations are
 * stripped from the operation registry (so search and every other discovery
 * surface never reveal them) AND refused by the execute tool (so even a guessed
 * or hard-coded name still cannot run them). Two independent layers, so the
 * boundary holds even if one is bypassed.
 */
export function isSecurityBlockedOperation(operation: string): boolean {
  return BLOCKED_OPERATIONS.has(operation);
}

/**
 * The result the execute tool returns for a security-blocked operation. It
 * confirms the block and its reason but deliberately reveals nothing about the
 * operation, the data it would have returned, or the denylist itself — so the
 * refusal can't be used to probe the system. No system configuration is ever
 * leaked.
 */
export function securityBlockedResult() {
  return {
    success: false,
    blocked: true,
    error: 'This operation is blocked for security reasons.',
    instruction:
      'Do NOT retry this operation or try to reach the same data another way. ' +
      'Tell the user the request was blocked for security reasons. Do not ' +
      'disclose, guess, or describe any system configuration, secrets, or ' +
      'environment values, and take no further action on this request.',
  };
}
