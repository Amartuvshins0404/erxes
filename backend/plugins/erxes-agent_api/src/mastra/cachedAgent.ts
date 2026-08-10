// ---------------------------------------------------------------------------
// Shared "lazily-built, cached Mastra Agent keyed by string" helper.
//
// getStatelessAgent, summarizerFor and summaryAgentFor each built the same
// thing three different ways: a tool-less Agent, cached per composed key, with
// @mastra/core/agent and the provider/model builder imported lazily so those
// heavy deps load only when the path actually runs. This factory owns that
// import + construct + cache logic behind a small interface — each call site
// just supplies its key and its Agent config.
//
// The cache is TTL-bounded (via createTTLCache) so it can never grow without
// limit across the process lifetime: entries expire instead of accumulating a
// fresh Agent per distinct provider/model forever.
// ---------------------------------------------------------------------------

import { createTTLCache } from '~/utils/ttlCache';

/** The provider/model builder, handed to each config builder so call sites keep
 *  their exact `buildModel(provider, model, providers)` invocation. Typed off
 *  the lazily-loaded module so this helper needs no static providers import. */
type BuildModelFn = (typeof import('~/mastra/providers'))['buildModel'];

export interface AgentBuildDeps {
  buildModel: BuildModelFn;
}

/** The subset of Mastra Agent constructor options these tool-less paths use. */
export interface AgentBuildConfig {
  id: string;
  name: string;
  instructions: string;
  model: unknown;
  outputProcessors?: unknown[];
}

export interface AgentCache<V> {
  /** Return the cached agent for `key`, or build it once (lazily importing
   *  @mastra/core/agent + the provider builder), cache it and return it. */
  getOrBuild(
    key: string,
    buildConfig: (deps: AgentBuildDeps) => AgentBuildConfig,
  ): Promise<V>;
}

// Agents are keyed by a small, stable set (provider/model, id) and are cheap to
// rebuild, so a generous TTL keeps hot entries warm while still evicting.
const DEFAULT_AGENT_TTL_MS = 30 * 60_000;

/** Build a bounded, lazily-populated cache of tool-less Mastra Agents. */
export function createAgentCache<V>(
  ttlMs: number = DEFAULT_AGENT_TTL_MS,
): AgentCache<V> {
  const cache = createTTLCache<V>(ttlMs);

  return {
    async getOrBuild(key, buildConfig) {
      const hit = cache.get(key);
      if (hit !== undefined) return hit;

      const { Agent } = await import('@mastra/core/agent');
      const { buildModel } = await import('~/mastra/providers');
      const agent = new Agent(
        buildConfig({ buildModel }) as never,
      ) as unknown as V;
      cache.set(key, agent);
      return agent;
    },
  };
}
