import { IContext } from '~/connectionResolvers';
import {
  VoiceStatus,
  resolveVoiceStatusForTenant,
} from '~/mastra/voice/resolveConfig';
import { CHIMEGE_VOICES } from '~/mastra/voice/voices';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

// Map the internal status to the GraphQL shape, adding the two derived
// "configured" booleans. Never includes tokens.
function toGraphql(status: VoiceStatus) {
  return {
    ...status,
    sttConfigured: status.sttSource !== 'none',
    ttsConfigured: status.ttsSource !== 'none',
  };
}

/** Secret-free query of the tenant's resolved Chimege voice configuration. */
export const voiceQueries = {
  mastraVoiceConfig: async (
    _parent: undefined,
    _args: undefined,
    { subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.settings.voiceManage);
    return toGraphql(await resolveVoiceStatusForTenant(subdomain));
  },

  // The full Chimege voice catalog for the settings selector. Not secret.
  mastraVoiceCatalog: async (
    _parent: undefined,
    _args: undefined,
    { checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.settings.statusRead);
    return CHIMEGE_VOICES;
  },
};
