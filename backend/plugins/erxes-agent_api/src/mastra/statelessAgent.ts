// ---------------------------------------------------------------------------
// Lazy, tool-less one-shot ("stateless") Mastra agents.
//
// Working-memory refresh needs a small agent that can never emit a tool call
// and runs a single generate per
// invocation. They all build the same thing: a tool-less Agent, cached per
// id+provider+model (+ processor pipeline), built lazily so @mastra/core and the
// provider/model builder load only when an extraction actually runs.
// ---------------------------------------------------------------------------

import {
  providerRuntimeFingerprint,
  type ProviderDocLike,
} from '~/mastra/providers';
import { createAgentCache } from '~/mastra/cachedAgent';

// The minimal surface these paths need from a Mastra Agent. Keeping it local
// avoids a static @mastra/core type dependency in a lazily-loaded path.
export interface StatelessAgent {
  generate(msgs: unknown, opts?: unknown): Promise<{ text?: string }>;
}

const agentCache = createAgentCache<StatelessAgent>();

export interface StatelessAgentSpec {
  id: string;
  name: string;
  instructions: string;
  provider: string;
  model: string;
  providers: ProviderDocLike[];
  outputProcessors?: unknown[];
}

/** Lazily build (and cache) a tool-less one-shot agent for the given spec. */
export async function getStatelessAgent(
  spec: StatelessAgentSpec,
): Promise<StatelessAgent> {
  const { id, name, instructions, provider, model, providers } = spec;
  // Include the processor count so an agent built with a different processor
  // pipeline (e.g. with vs. without the PIIDetector) is never reused.
  const key = `${id}:${provider}:${model}:${providerRuntimeFingerprint(
    providers,
  )}:p${spec.outputProcessors?.length ?? 0}`;
  return agentCache.getOrBuild(key, ({ buildModel }) => ({
    id,
    name,
    instructions,
    model: buildModel(provider, model, providers),
    ...(spec.outputProcessors?.length
      ? { outputProcessors: spec.outputProcessors }
      : {}),
  }));
}

/** One single-turn generate under the given auth context; returns text. */
export async function runStateless(
  agent: StatelessAgent,
  userContent: string,
  authCtx: { userHeader?: string; subdomain?: string },
): Promise<string> {
  const { runWithAuth } = await import('~/mastra/requestContext');
  const msgs = [{ role: 'user', content: userContent }];
  const result = await runWithAuth(authCtx, () =>
    agent.generate(msgs, { maxSteps: 1 }),
  );
  return result?.text ?? '';
}
