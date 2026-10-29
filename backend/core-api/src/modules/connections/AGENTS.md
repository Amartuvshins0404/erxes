# Connections module (core-api)

One core module owns every outbound third-party credential. Consumers never
store keys of their own: Agents chat reads connections in-process, every other
service fetches them through the `connections.resolve` tRPC procedure.

## Architecture

| Area       | Path                                                        | Responsibility                                                                                                                                             |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model      | `db/models/Connections.ts`, `db/definitions/connections.ts` | `connections` collection per tenant; add/edit/remove, user and service resolution, event logs without secrets                                              |
| Crypto     | `crypto.ts`                                                 | AES-256-GCM sealing of secret fields                                                                                                                       |
| Access     | `access.ts`                                                 | scope rules, secret status, decrypted view                                                                                                                 |
| Validation | `validation.ts`                                             | config/secret/service input checks against the type registry                                                                                               |
| Types      | `types/`                                                    | code registry of connection types (`ai`: `openai`, `grok`, `kimi`, `kimi-code`, `cloudflare-ai-gateway`)                                                   |
| GraphQL    | `graphql/`                                                  | `connectionsTypes`, `connections`, `connectionsDetail`, `connectionsServices`, `connectionsAdd`, `connectionsEdit`, `connectionsRemove`, `connectionsTest` |
| tRPC       | `trpc/connections.ts`                                       | `connections.resolve` behind `serviceProcedure`                                                                                                            |

## Data

- Document: `type, name, scope ('workspace' | 'personal'), ownerId (personal
only), config (non-secret, validated by type), secrets (field → sealed
envelope), services (workspace only), createdBy, updatedBy, timestamps`.
- `_id` is generated before sealing because it is part of the AAD.
- Model choice is not part of a connection; consumers pick it per use.
- No data migration from `agents_user_connections` or AI agent embedded keys.

## Encryption

- Key: HKDF-SHA256(ikm `ERXES_MASTER_KEY`, salt `erxes-connections`, info
  `connection-secrets-v1`, 32 bytes). `kid` = first 8 hex of sha256(key).
- Envelope `enc:v2:<kid>:<iv>:<tag>:<ct>` (base64url), AAD
  `${connectionId}:${field}`; ciphertext moved to another row or field fails.
- `ERXES_MASTER_KEY_PREVIOUS` (comma list) only opens; writes always use the
  current key. Re-entering a secret re-seals it under the current key.
- Fail closed: sealing without `ERXES_MASTER_KEY` throws `ExpectedError`;
  opening returns `null` on any failure. Values are never logged.

## Contracts

- Edit secrets: key omitted keeps the stored value, `""` clears it, any other
  value replaces it. Required secrets must remain present.
- `Connection.secretsSet` lists stored fields that open with the current keys;
  `secretsUnreadable` lists stored fields that do not (UI asks to re-enter).
  Secrets, sealed or plain, never leave through GraphQL.
- `connectionsServices` returns `automations` plus the available plugins from
  service discovery, excluding `core`.
- `connectionsTest` probes the type's default model through
  `agents/modelProbe.ts`; unreadable secrets report a re-enter error.
- `connections.resolve { _id }` returns `{ _id, type, name, config, secrets }`
  decrypted. Shared client: `resolveConnection` in
  `erxes-api-shared/core-modules`.

## Service authentication

- Each service signs tRPC calls with `x-erxes-service-auth`
  (`v1.<service>.<unixSeconds>.<sig>`), built in `erxes-api-shared/utils`
  `service-auth/`. The token is `ERXES_SERVICE_TOKEN`, or derived from
  `ERXES_MASTER_KEY` when only that is present. The service name is the one
  registered through `setCurrentServiceName` (`startPlugin` sets the plugin
  name; the automations and logs services set theirs in `main.ts`).
- The signature binds service, timestamp, subdomain, procedure path and the
  sha256 of the JSON input. Core accepts it within 300 seconds, compared with
  `timingSafeEqual`.
- Only the `connections` router uses `serviceProcedure`; other routers keep
  their existing auth.
- `pnpm erxes:secrets master` prints a new master key;
  `pnpm erxes:secrets service <name>` prints a service token.

## Invariants

- Workspace add/edit/remove/test require `connectionsManage`. Personal
  connections are visible and manageable only by their owner and need no
  permission. Any logged-in user lists workspace metadata.
- Services resolve only workspace connections whose `services` include the
  verified caller; personal and non-granted connections answer `NOT_FOUND`.
  Core itself resolves in-process and is always allowed.
- Agents chat may use workspace AI connections plus the user's personal ones.
- `sendDbEventLog` payloads carry `secretFields` names only, never `secrets`.
- `connectionsAdd` and `connectionsEdit` carry plaintext secrets in their
  args, so they skip the generic mutation logger (`skipPermission` via
  `markResolvers`) and call `checkLogin` themselves.
- The agent `callGraphql` deny policy blocks every `connections*` operation.
- New credential stores join as new types in `types/`; do not add parallel
  secret storage elsewhere.

## Validation

- `pnpm nx lint core-api`
- `pnpm nx build core-api`
- `pnpm nx test core-api` (`__tests__/crypto.test.ts`, `__tests__/access.test.ts`)
