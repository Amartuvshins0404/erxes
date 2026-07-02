// ---------------------------------------------------------------------------
// DB-aware voice resolution. The single DB read around the PURE merge logic in
// ./mergeConfig.ts: a tenant's stored Chimege config (bring-your-own-key) wins
// over the env, and env is the deployment-wide fallback default.
// ---------------------------------------------------------------------------

import { generateModels } from '~/connectionResolvers';
import { resolveVoiceConfig, VoiceConfig } from '~/mastra/voice/config';
import { val } from '~/mastra/configEnv';
import {
  VoiceStatus,
  computeVoiceStatusFrom,
  mergeVoiceConfig,
} from '~/mastra/voice/mergeConfig';

export {
  VoiceStatus,
  MergeOpts,
  computeVoiceStatusFrom,
  mergeVoiceConfig,
} from '~/mastra/voice/mergeConfig';

/** Read the deployment kill switch from the live env. */
function globallyDisabled(): boolean {
  return val(process.env, 'ERXES_AGENT_VOICE') === 'disable';
}

/** Resolve the effective voice config for a tenant (DB over env). */
export async function resolveVoiceConfigForTenant(
  subdomain: string,
): Promise<VoiceConfig> {
  const env = resolveVoiceConfig(process.env);
  const models = await generateModels(subdomain);
  const stored = await models.MastraVoiceConfig.getVoiceConfig();
  return mergeVoiceConfig(env, stored ? stored.toObject() : null, {
    globallyDisabled: globallyDisabled(),
  });
}

/** Per-tenant secret-free status (single DB read). */
export async function resolveVoiceStatusForTenant(
  subdomain: string,
): Promise<VoiceStatus> {
  const env = resolveVoiceConfig(process.env);
  const models = await generateModels(subdomain);
  const stored = await models.MastraVoiceConfig.getVoiceConfig();
  return computeVoiceStatusFrom(env, stored ? stored.toObject() : null, {
    globallyDisabled: globallyDisabled(),
  });
}
