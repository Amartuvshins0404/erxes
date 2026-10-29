import type { IResolvedConnection } from 'erxes-api-shared/core-modules';
import { probeProviderModel } from '@/agents/modelProbe';
import { getProviderDefaultModel, PROVIDER_DEFAULTS } from '@/agents/providers';
import type {
  IConnectionField,
  IConnectionTestResult,
  IConnectionTypeDefinition,
} from './definition';

const AI_DEFAULT_SERVICES = ['automations'];

const apiKeyField = (
  required: boolean,
  label = 'API key',
): IConnectionField => ({
  name: 'apiKey',
  label,
  kind: 'text',
  secret: true,
  required,
});

const baseUrlField = (
  placeholder: string,
  description: string,
): IConnectionField => ({
  name: 'baseUrl',
  label: 'Base URL',
  kind: 'url',
  secret: false,
  required: false,
  placeholder,
  description,
});

const headersField: IConnectionField = {
  name: 'headers',
  label: 'Extra headers',
  kind: 'headers',
  secret: false,
  required: false,
  description: 'Sent with every request to the provider.',
};

export const testAiConnection = async (
  resolved: IResolvedConnection,
): Promise<IConnectionTestResult> => {
  const result = await probeProviderModel({
    connection: resolved,
    model: getProviderDefaultModel(resolved.type),
  });

  return result.ok
    ? { ok: true }
    : {
        ok: false,
        error: result.error ?? 'The provider rejected the request.',
      };
};

const openAiCompatible = ({
  type,
  label,
  description,
}: {
  type: string;
  label: string;
  description: string;
}): IConnectionTypeDefinition => ({
  type,
  label,
  description,
  category: 'ai',
  fields: [
    apiKeyField(true),
    baseUrlField(
      PROVIDER_DEFAULTS[type].baseUrl,
      'Override only when requests go through a proxy.',
    ),
    headersField,
  ],
  defaultServices: AI_DEFAULT_SERVICES,
  test: testAiConnection,
});

export const AI_CONNECTION_TYPES: IConnectionTypeDefinition[] = [
  openAiCompatible({
    type: 'openai',
    label: 'OpenAI',
    description: 'OpenAI models with an OpenAI API key.',
  }),
  openAiCompatible({
    type: 'grok',
    label: 'Grok',
    description: 'xAI Grok models with an xAI API key.',
  }),
  openAiCompatible({
    type: 'kimi',
    label: 'Kimi',
    description: 'Moonshot Kimi models with a Moonshot API key.',
  }),
  openAiCompatible({
    type: 'kimi-code',
    label: 'Kimi Code',
    description: 'Kimi coding models over the Anthropic Messages protocol.',
  }),
  {
    type: 'cloudflare-ai-gateway',
    label: 'Cloudflare AI Gateway',
    description: 'Route model requests through a Cloudflare AI Gateway.',
    category: 'ai',
    fields: [
      {
        name: 'accountId',
        label: 'Account ID',
        kind: 'text',
        secret: false,
        required: true,
      },
      {
        name: 'gatewayId',
        label: 'Gateway ID',
        kind: 'text',
        secret: false,
        required: true,
      },
      {
        name: 'gatewayToken',
        label: 'Gateway token',
        kind: 'text',
        secret: true,
        required: false,
        description: 'Required when the gateway has authentication enabled.',
      },
      apiKeyField(false, 'Provider API key'),
      {
        name: 'mode',
        label: 'Mode',
        kind: 'select',
        secret: false,
        required: false,
        options: ['compat', 'openai-provider'],
        defaultValue: 'compat',
      },
      baseUrlField(
        PROVIDER_DEFAULTS['cloudflare-ai-gateway'].baseUrl,
        'Gateway root URL. Leave empty to use Cloudflare.',
      ),
      headersField,
    ],
    defaultServices: AI_DEFAULT_SERVICES,
    test: testAiConnection,
  },
];
