import { IUserDocument } from 'erxes-api-shared/core-types';

import { IModels } from '~/connectionResolvers';
import { SERVER_STATUSES } from './constants';
import { IAgentServerDocument } from './@types/agent';
import {
  assertIdentifierManageAccess,
  isAdminUser,
} from '~/modules/assistantOrg/permissions';

const SECRET_FIELD_PATTERN = /(token|api[_-]?key|secret|password)/i;
const SECRET_STRING_PATTERN =
  /(sk-|xox[baprs]-|Bearer\s+[A-Za-z0-9._-]+|openclaw-gateway-token|gh[pousr]_[A-Za-z0-9_]{16,})/i;

const SAFE_OPENCLAW_IDENTIFIER =
  /^(?:clawhub:)?(?:@?[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*(?:@[a-z0-9][a-z0-9._+-]*)?$/i;
const SAFE_OPENCLAW_QUERY = /^[a-z0-9][a-z0-9 ._:@/+,-]{0,79}$/i;
const SAFE_OPENCLAW_VERSION = /^[a-z0-9][a-z0-9._+-]{0,63}$/i;

type JsonRecord = Record<string, unknown>;

export type RuntimeGraphQLResult = {
  ok: boolean;
  status: string;
  stage: string | null;
  message: string;
  warnings: string[];
  diagnostics: JsonRecord | null;
  items: unknown[] | null;
  records: JsonRecord | null;
};

type RuntimeEndpointRequest =
  | { method: 'GET'; path: string }
  | { method: 'POST'; path: string; body: JsonRecord };

const getRuntimeSharedSecret = () => {
  const value = (process.env.ERXES_AI_ASSISTANT_RUNTIME_SHARED_SECRET || '').trim();

  if (!value) {
    throw new Error('ERXES_AI_ASSISTANT_RUNTIME_SHARED_SECRET is not configured');
  }

  return value;
};

function isPlainObject(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function redactSecrets<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item)) as T;
  }

  if (isPlainObject(value)) {
    const redacted: JsonRecord = {};

    for (const [key, entry] of Object.entries(value)) {
      redacted[key] = SECRET_FIELD_PATTERN.test(key)
        ? '[REDACTED]'
        : redactSecrets(entry);
    }

    return redacted as T;
  }

  if (typeof value === 'string') {
    return (SECRET_STRING_PATTERN.test(value) ? '[REDACTED]' : value) as T;
  }

  return value;
}

export function assertSafeRuntimeIdentifier(
  value: unknown,
  field = 'identifier',
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required`);
  }

  const identifier = value.trim();

  if (
    /(^[./~])|(\.\.)|(\\)|(;)|(\|)|(&&)|(\$\()|(`)/.test(identifier) ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(identifier) ||
    !SAFE_OPENCLAW_IDENTIFIER.test(identifier)
  ) {
    throw new Error(
      `${field} must be a registry, ClawHub, or pinned package identifier`,
    );
  }

  return identifier;
}

export function assertSafeRuntimeQuery(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('query is required');
  }

  const query = value.trim();

  if (
    /^[a-z][a-z0-9+.-]*:\/\//i.test(query) ||
    /(^[./~])|(\.\.)|(\\)|(;)|(\|)|(&&)|(\$\()|(`)/.test(query) ||
    !SAFE_OPENCLAW_QUERY.test(query)
  ) {
    throw new Error('query contains unsupported characters');
  }

  return query;
}

export function assertSafeRuntimeVersion(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string' || !SAFE_OPENCLAW_VERSION.test(value.trim())) {
    throw new Error('version contains unsupported characters');
  }

  return value.trim();
}

export function assertPluginInstallSpec(value: unknown): string {
  const plugin = assertSafeRuntimeIdentifier(value, 'plugin');
  const atIndex = plugin.startsWith('@')
    ? plugin.indexOf('@', 1)
    : plugin.indexOf('@');

  const isPinned = plugin.startsWith('clawhub:') || (atIndex > 0 && atIndex < plugin.length - 1);

  if (!isPinned) {
    throw new Error(
      'plugin must be a clawhub:<id> or pinned npm package identifier',
    );
  }

  return plugin;
}

export function buildPluginInstallIdentifier(
  plugin: unknown,
  version?: unknown,
): string {
  const safeVersion = assertSafeRuntimeVersion(version);
  const safePlugin = assertSafeRuntimeIdentifier(plugin, 'plugin');

  if (safePlugin.startsWith('clawhub:')) {
    if (safeVersion) {
      throw new Error('version is not supported for clawhub plugin installs');
    }

    return safePlugin;
  }

  const atIndex = safePlugin.startsWith('@')
    ? safePlugin.indexOf('@', 1)
    : safePlugin.indexOf('@');
  const alreadyPinned = atIndex > 0 && atIndex < safePlugin.length - 1;

  if (alreadyPinned) {
    if (safeVersion) {
      throw new Error('plugin version must be provided either inline or via version, not both');
    }

    return assertPluginInstallSpec(safePlugin);
  }

  if (!safeVersion) {
    throw new Error(
      'plugin must be a clawhub:<id> or pinned npm package identifier',
    );
  }

  return assertPluginInstallSpec(`${safePlugin}@${safeVersion}`);
}

export async function assertManagedRuntimeReadAccess(
  models: IModels,
  agentId: string,
  user?: IUserDocument,
) {
  const identifier = await assertIdentifierManageAccess(models, agentId, user);

  if (identifier.kind && identifier.kind !== 'assistant') {
    throw new Error('This identifier is not an AI Assistant');
  }

  return identifier;
}

export async function assertManagedRuntimeMutationAccess(
  models: IModels,
  agentId: string,
  user?: IUserDocument,
) {
  const identifier = await assertManagedRuntimeReadAccess(models, agentId, user);

  if (!isAdminUser(user)) {
    throw new Error(
      'Only workspace owners may install skills or enable plugins on managed runtimes',
    );
  }

  return identifier;
}

export function assertApprovedRuntimeServer(
  server: Pick<IAgentServerDocument, 'status' | 'url'> | null | undefined,
) {
  if (!server) {
    throw new Error('Assistant runtime server not found');
  }

  if (server.status !== SERVER_STATUSES.APPROVED) {
    throw new Error(
      'Assistant runtime is not approved yet. Wait until provisioning finishes successfully.',
    );
  }

  const runtimeUrl = server.url?.trim();

  if (!runtimeUrl) {
    throw new Error('Assistant runtime URL is not configured');
  }

  return runtimeUrl.replace(/\/+$/, '');
}

async function readRuntimeError(response: Response) {
  const raw = await response.text();

  try {
    const parsed = JSON.parse(raw) as { error?: string; message?: string };
    return redactSecrets(parsed.error || parsed.message || raw);
  } catch {
    return redactSecrets(raw);
  }
}

function buildRequestInit(request: RuntimeEndpointRequest) {
  const headers: Record<string, string> = {
    'x-erxes-ai-assistant-secret': getRuntimeSharedSecret(),
  };

  if (request.method === 'POST') {
    headers['Content-Type'] = 'application/json';
  }

  return {
    method: request.method,
    headers,
    body: request.method === 'POST' ? JSON.stringify(request.body) : undefined,
    signal: AbortSignal.timeout(45_000),
  };
}

export async function fetchManagedRuntimeOperation(
  runtimeUrl: string,
  request: RuntimeEndpointRequest,
): Promise<JsonRecord> {
  const response = await fetch(
    `${runtimeUrl}/api/erxes-ai-assistant/internal${request.path}`,
    buildRequestInit(request),
  );

  if (!response.ok) {
    const message = await readRuntimeError(response);
    throw new Error(typeof message === 'string' ? message : 'Runtime request failed');
  }

  const payload = (await response.json()) as JsonRecord;
  return redactSecrets(payload);
}

function inferStage(payload: JsonRecord): string | null {
  const stages = Array.isArray(payload.stages) ? payload.stages : [];
  const lastStage = stages[stages.length - 1];

  if (isPlainObject(lastStage) && typeof lastStage.status === 'string') {
    return lastStage.status;
  }

  return typeof payload.status === 'string' ? payload.status : null;
}

function inferWarnings(payload: JsonRecord): string[] {
  if (Array.isArray(payload.warnings)) {
    return payload.warnings.filter((item): item is string => typeof item === 'string');
  }

  const pluginDoctor = payload.pluginDoctor;
  if (isPlainObject(pluginDoctor) && Array.isArray(pluginDoctor.warnings)) {
    return pluginDoctor.warnings.filter(
      (item): item is string => typeof item === 'string',
    );
  }

  return [];
}

export function mapRuntimePayload(
  message: string,
  payload: JsonRecord,
  options: {
    diagnostics?: JsonRecord | null;
    items?: unknown[] | null;
    records?: JsonRecord | null;
  } = {},
): RuntimeGraphQLResult {
  const status =
    typeof payload.status === 'string'
      ? payload.status
      : payload.error
        ? 'failed'
        : 'ready';

  return {
    ok: status !== 'failed',
    status,
    stage: inferStage(payload),
    message,
    warnings: inferWarnings(payload),
    diagnostics: options.diagnostics ?? null,
    items: options.items ?? null,
    records: options.records ?? null,
  };
}

export function auditRuntimeOperation(entry: {
  assistantId: string;
  tenantId: string;
  userId?: string;
  operation: string;
  identifier?: string;
  status: string;
  durationMs: number;
}) {
  console.info(
    'managed_runtime_operation',
    redactSecrets({
      assistantId: entry.assistantId,
      tenantId: entry.tenantId,
      userId: entry.userId,
      operation: entry.operation,
      identifier: entry.identifier,
      status: entry.status,
      durationMs: entry.durationMs,
    }),
  );
}

export async function callManagedRuntimeOperation({
  models,
  user,
  subdomain,
  agentId,
  operation,
  request,
  identifier,
  requireAdmin = false,
  message,
  mapResult,
}: {
  models: IModels;
  user?: IUserDocument;
  subdomain: string;
  agentId: string;
  operation: string;
  request: RuntimeEndpointRequest;
  identifier?: string;
  requireAdmin?: boolean;
  message: string;
  mapResult: (payload: JsonRecord) => RuntimeGraphQLResult;
}) {
  if (requireAdmin) {
    await assertManagedRuntimeMutationAccess(models, agentId, user);
  } else {
    await assertManagedRuntimeReadAccess(models, agentId, user);
  }

  const startedAt = Date.now();

  try {
    const server = await models.AgentServer.findOne({ identifierId: agentId }).lean();
    const runtimeUrl = assertApprovedRuntimeServer(server);
    const payload = await fetchManagedRuntimeOperation(runtimeUrl, request);
    const result = mapResult(payload);

    auditRuntimeOperation({
      assistantId: agentId,
      tenantId: subdomain,
      userId: user?._id ? String(user._id) : undefined,
      operation,
      identifier,
      status: result.status,
      durationMs: Date.now() - startedAt,
    });

    return result;
  } catch (error) {
    const result = mapRuntimePayload(
      message,
      {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      },
      {
        records: {
          error: error instanceof Error ? error.message : String(error),
        },
      },
    );

    auditRuntimeOperation({
      assistantId: agentId,
      tenantId: subdomain,
      userId: user?._id ? String(user._id) : undefined,
      operation,
      identifier,
      status: result.status,
      durationMs: Date.now() - startedAt,
    });

    return result;
  }
}
