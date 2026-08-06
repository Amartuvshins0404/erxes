# Native Chat Store — design spec

Status: **DONE — native-only, no flag.** The custom `mastra_threads`/
`mastra_messages` mongoose store is deleted; the chat store IS Mastra's native
memory store (`erxes_mastra_memory`). Reads, writes, titling, feedback, the
learning sweep, schedules, and notification-triggered turns all run against
native. The `ERXES_AGENT_NATIVE_CHAT_STORE` flag is removed (native is
unconditional). **Consequence:** chat persistence follows the tenant's
`memoryEnabled` value from General Settings (enabled by default); the native
store is the only chat store, with no custom fallback. Legacy custom-store
conversations are not read (they age out); native threads created before the
agentId/subdomain metadata existed won't appear in the agent-scoped list.

**Principle (drives every decision below):** use Mastra's built-in capabilities
for everything Mastra owns; write custom code **only** where Mastra genuinely
cannot serve an erxes need. Replace the bespoke `mastra_threads` /
`mastra_messages` store + hand-rolled persistence/read layer with Mastra's
native memory store through a completed **cutover** (no backfill).

**Architecture decision: Level 2** — Mastra is the _engine_ (storage, retrieval,
recall, streaming); erxes keeps a _thin_ SSE/GraphQL **shell** for
auth, multi-tenancy, and the existing UI contract. (Level 3 — frontend on
`@mastra/client-js` + Mastra's HTTP server — was considered and declined: it
buys "Mastra owns the HTTP layer" at the cost of a frontend rewrite + auth
bridge, for the same irreducible custom core.)

---

## 1. Mastra built-in vs custom (the capability map)

| Concern                                                                                                   | Mastra built-in?                                                                                                                                 | Decision                                                                            |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Thread/message storage                                                                                    | ✅ native memory store (`mastra_threads`/`messages`/`resources` in `erxes_mastra_memory`)                                                        | **use native** — drop custom mongoose store                                         |
| Persist a turn                                                                                            | ✅ auto-persists on `agent.generate(msg, { memory })`                                                                                            | **use native** — drop `persistTurn`'s write                                         |
| List threads / get messages                                                                               | ✅ `listThreads({ filter:{ resourceId, metadata } })`, `listMessages`, `getThreadById`                                                           | **use native** — drop custom read layer                                             |
| Thread title generation                                                                                   | Native thread title field; no provider call                                                                                                      | **custom thin derivation** — first meaningful user request, capped at 60 characters |
| Recent-history replay                                                                                     | ✅ `lastMessages`                                                                                                                                | **use native** — already (#8058)                                                    |
| Working memory                                                                                            | ✅ native                                                                                                                                        | **use native** — already (#8058)                                                    |
| Streaming engine                                                                                          | ✅ `agent.stream()`                                                                                                                              | **use native** — erxes shell just relays chunks                                     |
| Tool-call / reasoning capture                                                                             | ✅ native `content.parts`                                                                                                                        | **use native**, translate to the UI shape                                           |
| **Auth + tool execution via the erxes gateway**                                                           | ❌ Mastra can't (tools run as the selected agent's linked AI team-member account, forwarding the internal `user` identity and tenant `hostname`) | **custom** (the agent + tools, unchanged)                                           |
| **Multi-tenant subdomain scoping**                                                                        | ❌ not a Mastra concept                                                                                                                          | **custom** (thin: `scopedResource`)                                                 |
| **Learning / distillation**                                                                               | ❌ erxes-specific                                                                                                                                | **custom** (re-pointed to read the native store)                                    |
| **UI GraphQL/SSE contract** + erxes-only fields (`interrupted`, `learningIdsInContext`, attachment shape) | ❌ Mastra's shapes differ                                                                                                                        | **custom** (thin translation + a `content.metadata` patch)                          |

Everything in the "custom" rows is a genuine "Mastra cannot do this for erxes"
case. Everything else becomes Mastra-native.

---

## 2. Current state

- `agent.generate()` and `agent.stream()` persist each turn only in `erxes_mastra_memory`; `persistTurn` reconciles native ids and erxes-owned metadata without a second chat write.
- The UI reads native threads/messages through the GraphQL/SSE translation layer. Rich per-message data and thread metadata are patched into the native records.
- The erxes session id is the Mastra thread id; resource ownership remains `scopedResource(subdomain, userId)`.

---

## 3. Target architecture (Level 2)

```
SSE /chat/stream            ┌─────────────────────────────────────────┐
mastraAgentChat (fallback) ─▶│ erxes shell: auth · tenancy · UI contract │
                            └───────────────┬───────────────────────────┘
                                            │ delegates to
                                            ▼
                         agent.generate/stream(msg, { memory:{thread,resource} })
                                            │  (Mastra owns the engine)
                                            ▼
                  Mastra Memory ── persist · workingMemory · recall
                    └─ MongoDBStore(erxes_mastra_memory)
                                            │
UI (unchanged) ◀─ GraphQL/SSE translate native ⇄ MastraThread/MastraMessage ◀─┘
```

- The transports (SSE + the `mastraAgentChat` blocking fallback) are kept (Level 2) — they delegate to the agent + Mastra memory, and **translate** native
  records into the existing GraphQL/SSE shapes so the frontend is untouched.
- erxes adds only: auth/tenancy, the tool-exec gateway (the agent's tools), the
  learning system, and a small `content.metadata` patch for erxes-only fields.

---

## 4. Schema mapping

### 4.1 Thread (`MastraThread` ⇄ native `StorageThreadType`)

| UI/erxes field          | Native location                                         |
| ----------------------- | ------------------------------------------------------- |
| `threadId`              | `thread.id` (same session id, already 1:1)              |
| ownership (`userId`)    | `thread.resourceId = scopedResource(subdomain, userId)` |
| `agentId`               | `thread.metadata.agentId` (list query filters on it)    |
| `title`                 | `thread.title` (derived before the first model call)    |
| `titleSource`           | `thread.metadata.titleSource` (`derived` or `manual`)   |
| `messageCount`          | **derive on read** (count native messages)              |
| `lastMessageAt`         | `thread.updatedAt`                                      |
| `distilledMessageCount` | `thread.metadata.distilledMessageCount`                 |

Thread list: `listThreads({ filter:{ resourceId: scopedResource(subdomain, userId), metadata:{ agentId } } })` → translate to `[MastraThread]`.

### 4.2 Message (`MastraMessage` ⇄ native `MastraDBMessage`)

| UI/erxes field                                    | Native location                                                                                                                   |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `_id` (feedback key)                              | `message.id` (native id — see §10)                                                                                                |
| `role` / `createdAt`                              | same                                                                                                                              |
| `content` (string)                                | `message.content.content`                                                                                                         |
| `meta.thinking` / `meta.toolCalls` / `meta.parts` | `content.metadata.erxes.*` — erxes ordered shape kept verbatim for faithful replay (native `content.parts` is the lossy fallback) |
| `meta.interrupted` / `meta.learningIdsInContext`  | `content.metadata.erxes.*` (erxes-only)                                                                                           |
| `attachments`                                     | `content.metadata.erxes.attachments` (erxes `{url,name,type,size}`)                                                               |

**Namespacing (as built):** erxes-only fields live under a single
`content.metadata.erxes` blob, **not** as flat `content.metadata.*` keys, so they
never collide with Mastra's own `content.metadata` keys. erxes owns both the
write and the (Phase 3) read of that blob.

**Write path:** Mastra auto-persists the turn during `generate()`/`stream()`.
The shell recalls only the recent tail when it must recover a native message id
or patch erxes-only metadata. `patchNativeTurn` in
`src/modules/agent/persist.ts` adds attachments, interruption state, guarded
replacement text, and any retained legacy summary metadata through the native
storage-domain `patchNativeMessages` API. Thread registration independently
preserves the tenant/agent binding and the current title.

---

## 5. Titles

Thread titles are derived synchronously from the first meaningful user request:
remove attachment manifests and Markdown decoration, keep at most eight words,
and cap the result at 60 characters. Greetings leave the title blank so the next
meaningful request can supply it. This path is deterministic and never calls a
provider.

`prepareTurn` passes the candidate to `ensureThreadRegistered` before model
execution. A new native thread receives the title plus
`metadata.titleSource='derived'`; an existing blank thread is backfilled unless
its source is `manual`.

A manual rename writes both `thread.title` and
`metadata.titleSource='manual'`. Registration and persistence preserve that
title, so later turns never overwrite it.

---

## 6. Cutover (no backfill)

The completed native-only cutover has these properties:

- **Writes** go to the native store only (custom dual-write removed).
- **Reads** serve the native store, **native-only** — legacy custom-store threads
  were intentionally not backfilled.
- The obsolete custom chat collections and models are removed.

---

## 7. Workspace memory control

- General Settings persists `memoryEnabled` per tenant; it defaults to on for
  existing tenants and new settings documents.
- Turning it off intentionally disables native chat persistence, replay,
  semantic recall, and working memory for every agent in that tenant.
- Rollback = turn memory back on in General Settings. No environment restart is
  required.

---

## 8. Component changes

| Component                               | Change                                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `modules/agent/persist.ts`              | reconciles native ids, attachments, interruption state, artifacts, and guarded replacement text                     |
| `mastra/streamTurn.ts` SSE              | streams native chunks; persistence and deterministic title reconciliation happen after the visible answer           |
| `mastraAgentChat` (kept)                | thin `agent.generate` wrapper; shares the same native persist + translate                                           |
| `session/graphql` reads + rename/remove | read/translate from native store; rename → `updateThread`; remove → native `deleteThread`                           |
| `mastra/memory/mastraMemory.ts`         | owns 12-message replay and resource-scoped working memory; it performs no model-based titling                       |
| `mastra/titler.ts`                      | derives an eight-word/60-character title from the first meaningful request without a provider call                  |
| `learning/worker.ts`                    | idle/undistilled query + cursor against native threads (`metadata.distilledMessageCount`); messages via native list |
| feedback (`mastraMessageFeedback`)      | keys off the native message id; ownership via `resourceId`                                                          |
| `session/db/*` custom models            | removed                                                                                                             |

---

## 9. Risks & mitigations

- **Feedback id change** — native id ≠ custom `_id`. Return native ids in
  `mastraThreadMessages._id` + SSE `done.messageId`; old feedback rows go stale
  (cutover, acceptable).
- **Rich-meta fidelity** — store erxes shapes verbatim in `content.metadata`;
  don't rely on lossy native-part inference for the UI.
- **Ownership / agent filtering** — `thread.metadata.agentId` + `filter`;
  ownership via `resourceId`.
- **Title precedence** — thin manual guard (§5).

---

## 10. Phased rollout

1. **Spec** (this doc) — review. ✅
2. **Native title + write patch** — ✅ **done.** Established the native thread
   binding and erxes metadata patch over Mastra-persisted turns. The current
   runtime derives the first meaningful title before provider execution, while
   `modules/agent/persist.ts` reconciles message ids and erxes-owned metadata.
3. **Read path** — ✅ **done.** `session/nativeStore.ts` translates native
   threads/messages → the `MastraThread`/`MastraMessage` GraphQL shapes;
   resolvers (list/transcript/rename/remove) + SSE + feedback serve native;
   ownership is by resourceId scope.
4. **Repoint** — ✅ **done.** Learning sweep (`worker.ts`), feedback
   (`learning` mutation + `mastraMessageFeedbacks` query), schedules
   (`runner.ts`), and notification-triggered turns all run against native.
   Background workflows and notification turns execute as the owning or
   recipient agent's active linked AI team-member principal. `turn.ts` stamps
   `thread.metadata.{agentId,subdomain}` so the sweep can enumerate a tenant's
   threads (resourceId is per-user).
5. **Cutover / cleanup** — ✅ **done.** Custom writes dropped from
   `persistTurn`/`prepareChatTurn` (native ownership replaces the custom gate);
   custom title-model code, chat models, and definitions were removed and
   unregistered from `connectionResolvers`; the transitional cutover flag was
   removed (native is unconditional).

The transitional flag used during phases 2–4 is no longer present.

---

## 11. Resolved decisions / non-goals

- **Level 2** (Mastra engine + thin erxes shell) — not Level 3.
- **Cutover, no backfill**; legacy history **ages out** (no union).
- **Keep `mastraAgentChat`** (frontend untouched).
- **`messageCount` derive-on-read.**
- **Non-goals:** frontend changes; migrating historical conversations.
