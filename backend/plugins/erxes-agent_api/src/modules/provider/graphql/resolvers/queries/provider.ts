import { IContext } from '~/connectionResolvers';
import { PROVIDER_PRESETS } from '~/mastra/providers';
import { toPublicProvider } from '@/provider/utils/mask';
import {
  resolveProviderOwner,
  requireProviderAccess,
} from '@/provider/authorization';
import type { MastraProviderScope } from '@/provider/@types/provider';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

// One entry of a provider's live model-listing response. Field names cover
// the OpenAI/Anthropic/Mistral (`id`, `display_name`), Google (`name`,
// `displayName`, `supportedGenerationMethods`) and Cohere (`name`) shapes.
interface ProviderModelEntry {
  id?: string;
  name?: string;
  display_name?: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
}

/** Queries over configured providers, presets, and live model catalogs. */
export const providerQueries = {
  mastraProviders: async (
    _parent: undefined,
    { scope }: { scope?: MastraProviderScope },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.provider.configRead);
    const owner = await resolveProviderOwner({
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.provider.configRead,
      requestedScope: scope,
    });
    const providers = await models.MastraProvider.getProviders(owner);
    return providers.map(toPublicProvider);
  },

  mastraProvider: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.provider.configRead);
    const provider = await models.MastraProvider.getProvider(_id);
    await requireProviderAccess({
      provider,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.provider.configRead,
    });
    return toPublicProvider(provider);
  },

  // Returns static presets for the provider administration form.
  mastraProviderPresets: async (
    _parent: undefined,
    _args: undefined,
    { checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.provider.catalogRead);
    return PROVIDER_PRESETS;
  },

  // Returns all known providers (from presets list) enriched with isConfigured.
  mastraProviderCatalog: async (
    _parent: undefined,
    _args: undefined,
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.provider.catalogRead);
    const storedProviders = await models.MastraProvider.getRuntimeProviders(
      user?._id,
    );
    const storedSet = new Set(storedProviders.map((stored) => stored.provider));
    const presetKeys = new Set(
      PROVIDER_PRESETS.map((preset) => preset.provider),
    );

    return [
      ...PROVIDER_PRESETS.map((preset) => ({
        provider: preset.provider,
        label: preset.label,
        isOpenAICompatible: preset.isOpenAICompatible ?? false,
        isConfigured:
          storedSet.has(preset.provider) ||
          !!(preset.envKey && process.env[preset.envKey]),
      })),
      ...storedProviders
        .filter((stored) => !presetKeys.has(stored.provider))
        .map((stored) => ({
          provider: stored.provider,
          label: stored.label || stored.provider,
          isOpenAICompatible: stored.isOpenAICompatible ?? false,
          isConfigured: true,
        })),
    ];
  },

  // Returns the models a provider ACTUALLY serves right now, by querying its
  // live model-listing API (the stored DB doc's endpoint first, then the
  // preset's). There is intentionally no static list to fall back to — when
  // the endpoint is unreachable or unconfigured the list is empty and the UI
  // offers manual model-id entry.
  mastraProviderModels: async (
    _parent: undefined,
    { provider }: { provider: string },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.provider.catalogRead);
    const storedProviders = await models.MastraProvider.getRuntimeProviders(
      user?._id,
    );
    const stored = storedProviders.find(
      (candidate) => candidate.provider === provider,
    );
    // Fall back to preset data for missing fields
    const preset = PROVIDER_PRESETS.find(
      (entry) => entry.provider === provider,
    );

    const apiKey =
      stored?.apiKey ||
      (stored?.envKey ? process.env[stored.envKey] : undefined) ||
      (preset?.envKey ? process.env[preset.envKey] : undefined);

    // `||` (not `??`) on purpose: the Add Provider form saves untouched fields
    // as empty strings, and a stored `modelsEndpoint: ''` must not shadow the
    // preset endpoint or the {baseUrl}/models convention.
    const endpoint =
      stored?.modelsEndpoint ||
      preset?.modelsEndpoint ||
      (stored?.isOpenAICompatible && stored?.baseUrl
        ? `${stored.baseUrl}/models`
        : undefined) ||
      (preset?.isOpenAICompatible && preset?.baseUrl
        ? `${preset.baseUrl}/models`
        : undefined);

    if (!endpoint || !apiKey) return [];

    try {
      // Include any custom headers (e.g. the coding-agent User-Agent that
      // Kimi For Coding requires, or Anthropic's version header) so gated
      // catalog endpoints also resolve.
      const headers: Record<string, string> = {
        ...(preset?.headers || {}),
        ...(stored?.headers || {}),
      };
      let url = endpoint;

      // Provider auth schemes: Bearer (default), x-api-key (Anthropic),
      // ?key= query param (Google Generative Language).
      const auth = preset?.modelsAuth ?? 'bearer';
      if (auth === 'x-api-key') headers['x-api-key'] = apiKey;
      else if (auth === 'query') {
        url += `${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(
          apiKey,
        )}`;
      } else headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.warn(
          `[mastra:providers] model listing for "${provider}" failed: HTTP ${res.status} from ${endpoint}`,
        );
        return [];
      }

      const json = (await res.json()) as {
        data?: ProviderModelEntry[];
        models?: ProviderModelEntry[];
      };
      // OpenAI/Anthropic/Mistral style: { data: [{ id, name?, display_name? }] }
      // Google style:  { models: [{ name: "models/x", displayName, supportedGenerationMethods }] }
      // Cohere style:  { models: [{ name }] }
      const list: ProviderModelEntry[] = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.models)
        ? json.models
        : [];

      return (
        list
          // Google lists embedding/vision-only entries too — keep chat models.
          .filter(
            (model) =>
              !Array.isArray(model.supportedGenerationMethods) ||
              model.supportedGenerationMethods.includes('generateContent'),
          )
          .map((model) => {
            const id =
              model.id ||
              (typeof model.name === 'string'
                ? model.name.replace(/^models\//, '')
                : '');
            return {
              id,
              name:
                model.display_name ||
                model.displayName ||
                (model.id ? model.name : undefined) ||
                id,
            };
          })
          .filter((model) => model.id)
      );
    } catch (err) {
      const message =
        (err as { message?: string } | null | undefined)?.message ||
        String(err);
      console.warn(
        `[mastra:providers] model listing for "${provider}" failed: ${message}`,
      );
      return [];
    }
  },
};
