import type { ConnectorHandler } from '@mastra/mongodb' with {
  'resolution-mode': 'import',
};
import type { MastraMemory } from '@mastra/core/memory' with {
  'resolution-mode': 'import',
};
import type { Mastra } from '@mastra/core/mastra' with {
  'resolution-mode': 'import',
};
import mongoose from 'mongoose';

/**
 * Tenant-scoped conversation persistence for the agents, built on Mastra's
 * Memory + MongoDBStore. Threads, messages, and their indexes live entirely
 * inside Mastra-owned collections in a dedicated agents sub-database; this
 * plugin defines no custom models for them.
 *
 * The store reuses the plugin's existing mongoose connection through the
 * library-sanctioned `connectorHandler` seam instead of re-reading MONGO_URL,
 * so there is exactly one Mongo client per process. Collections resolve
 * against a dedicated `{baseDb}_agents_memory` database (derived, not
 * read from env) so the agents' conversation data never collides with, or
 * is muddled by, the platform's own legacy Mastra collections. The
 * connection's lifecycle is owned by the platform (`erxes-api-shared/utils`
 * connect()), so `close()` is intentionally a no-op.
 */

const MONGODB_STORE_ID = 'erxes-agent-store';
/** Recent messages replayed into the prompt alongside the newest one. */
const LAST_MESSAGES_WINDOW = 20;

/**
 * Resolves the dedicated agents memory database off the shared connection.
 * Mongoose caches sub-connections by name, so calling this repeatedly is
 * cheap; it stays lazy because the connection may not be open at import time.
 */
const agentsMemoryDbName = (): string => {
  const base = mongoose.connection.db?.databaseName;

  if (!base) {
    throw new Error('Mongoose connection is not open yet.');
  }

  return `${base}_agents_memory`;
};

/**
 * Structural bridge between mongoose's bundled driver and @mastra/mongodb's
 * bundled driver: both wrap a MongoDB deployment but ship different major
 * versions of the `Collection` typings, so the shared connection's collection
 * handle passes through one explicit, narrow cast at this boundary.
 */
const mongooseConnectorHandler: ConnectorHandler = {
  getCollection: async (collectionName) => {
    const subDb = mongoose.connection.useDb(agentsMemoryDbName());
    const db = subDb.db;

    if (!db) {
      throw new Error('Agents memory database is not connected yet.');
    }

    return db.collection(collectionName) as unknown as Awaited<
      ReturnType<ConnectorHandler['getCollection']>
    >;
  },
  close: async () => {
    // Intentional no-op: the platform owns the shared connection lifecycle.
  },
};

/**
 * The per-tenant agents runtime bundle: conversation memory plus a minimal
 * Mastra instance that shares the same MongoDBStore. The Mastra instance
 * exists only to give agent runs a persistent workflow-snapshot store, which
 * is what makes destructive-tool approval suspend/resume durable across
 * requests and restarts (a standalone Agent otherwise falls back to an
 * ephemeral in-memory store whose snapshots die with the request).
 */
export interface IAgentsRuntime {
  memory: MastraMemory;
  mastra: Mastra;
}

const createAgentsRuntime = async (): Promise<IAgentsRuntime> => {
  // All three packages are loaded dynamically from CommonJS like the other
  // ESM-only Mastra entries used by this plugin.
  const [{ MongoDBStore }, { Memory }, { Mastra }] = await Promise.all([
    import('@mastra/mongodb'),
    import('@mastra/memory'),
    import('@mastra/core/mastra'),
  ]);

  const storage = new MongoDBStore({
    id: MONGODB_STORE_ID,
    connectorHandler: mongooseConnectorHandler,
  });

  // Library-driven conversation memory. `generateTitle: true` makes Mastra
  // derive a thread title from the first user message asynchronously (agent
  // model, no response-time cost); semantic recall stays off until retrieval
  // features are added because it needs an embedder/vector store.
  const memory = new Memory({
    storage,
    options: {
      lastMessages: LAST_MESSAGES_WINDOW,
      generateTitle: true,
    },
  });

  // Minimal Mastra instance: no registries, no workers, no logging. Its only
  // job is to persist agentic-loop snapshots (suspended destructive tool
  // calls) into the same dedicated agents sub-database through the shared
  // store's workflows domain.
  const mastra = new Mastra({ storage, logger: false, workers: false });

  return { memory, mastra };
};

// One runtime bundle (and therefore one store/init cycle) per subdomain per
// process. Pending promises are cached so concurrent requests cannot
// double-run store initialization; failed creations are evicted so the next
// request retries.
const runtimeCache = new Map<string, Promise<IAgentsRuntime>>();

export const getAgentsRuntime = async (
  subdomain: string,
): Promise<IAgentsRuntime> => {
  const cached = runtimeCache.get(subdomain);

  if (cached) {
    return cached;
  }

  const creation = createAgentsRuntime();

  runtimeCache.set(subdomain, creation);

  try {
    return await creation;
  } catch (error) {
    runtimeCache.delete(subdomain);

    throw error;
  }
};

export const getAgentsMemory = async (
  subdomain: string,
): Promise<MastraMemory> => {
  const runtime = await getAgentsRuntime(subdomain);

  return runtime.memory;
};