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
//
// The denylist is grouped into explicitly-named category Sets below, merged into
// one BLOCKED_OPERATIONS Set. Each category documents WHY its members are unsafe
// from chat, so the boundary stays auditable and deterministic (no substring
// matching that could over- or under-block as the schema grows).

// Config store: each of these reads core's Config documents — integration
// credentials, payment-provider keys, SMTP / API secrets — by querying the
// whole collection, by code, or straight from the environment.
const CONFIG_STORE_OPERATIONS = new Set<string>([
  'configs',
  'configsByCode',
  'configsGetValue',
  'configsGetEnv',
]);

// Config-store clones: per-plugin config resolvers that hit the same secret
// store under a different field name (accounting, multinventory, PMS, calls,
// facebook, instagram).
const CONFIG_STORE_CLONE_OPERATIONS = new Set<string>([
  'accountingsConfigsByCode',
  'accountingsConfigs',
  'mnConfigs',
  'pmsConfigsGetValue',
  'callsGetConfigs',
  'facebookGetConfigs',
  'instagramGetConfigs',
]);

// Auth/session: ops that mint or destroy login sessions — running them from
// chat would let the agent authenticate as someone else or sign users out.
const AUTH_SESSION_OPERATIONS = new Set<string>([
  'login',
  'logout',
  'loginWithGoogle',
  'loginWithMagicLink',
  'usersConfirmInvitation',
  'usersResendInvitation',
]);

// Password: anything that initiates or completes a password change/reset, which
// is an account-takeover primitive.
const PASSWORD_OPERATIONS = new Set<string>([
  'forgotPassword',
  'resetPassword',
  'usersResetMemberPassword',
  'usersChangePassword',
]);

// ClientPortal auth: the end-customer-facing login / registration / OTP / token
// surface — the same takeover risk as staff auth, for portal users.
const CLIENT_PORTAL_AUTH_OPERATIONS = new Set<string>([
  'clientPortalUserLoginWithCredentials',
  'clientPortalUserLoginWithOTP',
  'clientPortalUserLoginWithSocial',
  'clientPortalUserRefreshToken',
  'clientPortalUserVerify',
  'clientPortalUserRegisterWithSocial',
  'clientPortalUserResetPassword',
  'clientPortalUserForgotPassword',
  'clientPortalUserRequestOTP',
  'clientPortalUserChangePassword',
  'clientPortalUserRegister',
]);

// Permission/escalation: ops that grant, revoke, or reassign permissions —
// privilege-escalation primitives if the agent could call them.
const PERMISSION_ESCALATION_OPERATIONS = new Set<string>([
  'permissionGroupAdd',
  'permissionGroupEdit',
  'permissionGroupRemove',
  'userAddCustomPermission',
  'userRemoveCustomPermission',
  'userUpdatePermissionGroups',
  'usersUpdatePermissionGroups',
]);

// Permission recon reads: enumerate the permission model (groups, defaults,
// modules) — reconnaissance that precedes an escalation attempt.
const PERMISSION_RECON_OPERATIONS = new Set<string>([
  'permissionGroups',
  'permissionGroupDetail',
  'permissionDefaultGroups',
  'permissionModules',
]);

// Credential (apps): the app/API-key management surface — listing, detailing,
// or minting app credentials hands over machine-to-machine secrets.
const CREDENTIAL_APP_OPERATIONS = new Set<string>([
  'apps',
  'appDetail',
  'appsAdd',
  'appsEdit',
  'appsRevoke',
  'appsRemove',
]);

// Credential (oauth): the OAuth-client management surface — same credential
// exposure as apps, for OAuth client apps.
const CREDENTIAL_OAUTH_OPERATIONS = new Set<string>([
  'oauthClientApps',
  'oauthClientAppDetail',
  'oauthClientAppsAdd',
  'oauthClientAppsEdit',
  'oauthClientAppsRevoke',
  'oauthClientAppsRemove',
]);

const BLOCKED_OPERATIONS = new Set<string>([
  ...CONFIG_STORE_OPERATIONS,
  ...CONFIG_STORE_CLONE_OPERATIONS,
  ...AUTH_SESSION_OPERATIONS,
  ...PASSWORD_OPERATIONS,
  ...CLIENT_PORTAL_AUTH_OPERATIONS,
  ...PERMISSION_ESCALATION_OPERATIONS,
  ...PERMISSION_RECON_OPERATIONS,
  ...CREDENTIAL_APP_OPERATIONS,
  ...CREDENTIAL_OAUTH_OPERATIONS,
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
