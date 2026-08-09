// ---------------------------------------------------------------------------
// Mastra Memory — recent-history replay + working memory backed by one shared
// Mongo DB (records).
//
// Replaces the custom history/working-memory implementation for the chat path.
// A SINGLE Memory instance is shared across tenants, on the app's own Mongo
// connection (MONGO_URL) in a dedicated database. Mastra uses a fixed set of
// memory collections (threads/messages/resources/observational), so one shared
// database keeps the footprint at ~4 collections total instead of multiplying
// the full MongoDBStore system schema per tenant (which trips the Atlas
// shared-tier 500-collection cap). Tenant isolation is enforced by the
// tenant-prefixed resourceId (see scopedResource) — resource-scoped working
// memory filters by that resource, so tenant A never reads tenant B. The
// tool-call filter is NOT configured here — in @mastra/memory 1.20.3 it lives
// on the Agent's inputProcessors (Memory({ processors }) was removed);
// agentRuntime attaches it.
// ---------------------------------------------------------------------------
import { Memory } from '@mastra/memory';
import { MongoDBStore } from '@mastra/mongodb';

// Memory storage shares the app's Mongo connection (MONGO_URL). Mastra's
// MongoDBStore provisions its collections in a dedicated database on that same
// cluster (memoryDbName), so there is a single Mongo to operate.
const MONGO_URL = () => process.env.MONGO_URL || 'mongodb://localhost:27017';

/** The single shared Mastra-memory database name. */
function memoryDbName(): string {
  const name = (
    process.env.ERXES_AGENT_MEMORY_DB_PREFIX || 'erxes_mastra_memory'
  ).trim();
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

let _shared: Memory | null = null;
let _store: MongoDBStore | null = null;
let _building: Promise<Memory> | null = null;

/**
 * The shared Mastra Memory (cached). `subdomain` is accepted for call-site
 * symmetry but does not select the instance — isolation is by resourceId
 * (see scopedResource), so a single instance serves every tenant.
 */
export function getMastraMemory(subdomain?: string): Promise<Memory>;
export async function getMastraMemory(): Promise<Memory> {
  if (_shared) return _shared;
  if (_building) return _building;

  _building = (async () => {
    const storage = new MongoDBStore({
      id: 'erxes-agent-memory',
      url: MONGO_URL(),
      dbName: memoryDbName(),
    } as never);
    _store = storage;

    const memory = new Memory({
      storage,
      options: {
        // Mastra owns recent-history replay + working memory for this turn —
        // and the thread/message records ARE the chat store the UI reads (via
        // session/nativeStore.ts). There is no separate store.
        lastMessages: 12,
        // Resource-scoped working memory: a per-user record (Markdown template)
        // that persists across the user's threads. It is stored as a field on
        // the resource document in the fixed `mastra_resources` collection
        // (updateResource) — one row per user, NOT a collection per user — so it
        // adds no collections and is safe on the shared DB.
        workingMemory: { enabled: true, scope: 'resource' },
      },
    } as never);

    _shared = memory;
    return memory;
  })();

  try {
    return await _building;
  } finally {
    _building = null;
  }
}

/**
 * The shared Mastra memory STORE (MongoDBStore on erxes_mastra_memory). Built
 * alongside the Memory instance; exposed so the chat layer can reach
 * storage-domain methods Memory does not surface. Ensures the Memory is built
 * first.
 */
export async function getMastraStore(
  subdomain?: string,
): Promise<MongoDBStore> {
  await getMastraMemory(subdomain);
  if (!_store) throw new Error('Mastra memory store not initialized');
  return _store;
}

/** Tenant-scoped resource id so shared memory records stay isolated per tenant. */
export function scopedResource(subdomain: string, resourceId: string): string {
  return `${(subdomain || 'os').trim() || 'os'}:${resourceId}`;
}

/** Drop the cached instance (tests / config changes). */
export function resetMastraMemoryCache(): void {
  _shared = null;
  _store = null;
  _building = null;
}
