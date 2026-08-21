/**
 * Mastra Studio bridge entry.
 *
 * Mirrors erxes-agent's real agents + their NATIVE Mastra Memory (Mongo
 * `erxes_mastra_memory`) into Mastra Studio, by reusing the production
 * runtime (getOrCreateAgent + getMastraMemory). No schema translation — it is
 * Mastra-native end to end.
 *
 *   - agents:  the tenant's real, tool-bound erxes agents (full reuse), each with
 *              native memory attached when tenant memory is enabled.
 *   - storage: the same native MongoDBStore (`erxes_mastra_memory`) for the
 *              global thread browser.
 *
 * Loaded by the `mastra` CLI via the conventional `src/mastra/index.ts` re-export.
 * Requires the same reachable MONGO_URL erxes uses; full-reuse agents also need
 * the gateway (:4000) for tools. Memory follows the tenant's General Settings.
 */
import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { studioStorage } from './storage';
import { buildStudioAgents } from './agents';

// Top-level await: register the real erxes agents before Mastra.
const real = await buildStudioAgents();

// Always render *something* so a misconfigured tenant is obvious, not blank.
const fallback = new Agent({
  id: 'studio-info',
  name: 'studio-info',
  instructions:
    'No erxes agents were registered. Check MONGO_URL, the gateway (:4000), and that mastra_agents holds active AI team members.',
  model: openai('gpt-4o-mini'),
});

export const mastra = new Mastra({
  agents: Object.keys(real).length ? real : { 'studio-info': fallback },
  storage: studioStorage(),
});
