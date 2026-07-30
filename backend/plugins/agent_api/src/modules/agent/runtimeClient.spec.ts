import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import {
  assertApprovedRuntimeServer,
  assertManagedRuntimeMutationAccess,
  callManagedRuntimeOperation,
  assertSafeRuntimeIdentifier,
  buildPluginInstallIdentifier,
  fetchManagedRuntimeOperation,
  mapRuntimePayload,
  redactSecrets,
} from './runtimeClient';

const originalFetch = global.fetch;
const originalEnv = {
  runtimeSecret: process.env.ERXES_AI_ASSISTANT_RUNTIME_SHARED_SECRET,
};

const createModels = (server?: Record<string, unknown>) =>
  ({
    Identifier: {
      findById: () => ({
        lean: async () => ({
          _id: 'assistant-1',
          kind: 'assistant',
          name: 'Assistant',
          slug: 'assistant',
          createdUserId: 'owner-1',
          memberIds: ['member-1'],
        }),
      }),
    },
    AgentServer: {
      findOne: () => ({
        lean: async () => server || null,
      }),
    },
  }) as any;

const createManagerModels = (server?: Record<string, unknown>) =>
  ({
    Identifier: {
      findById: () => ({
        lean: async () => ({
          _id: 'assistant-1',
          kind: 'assistant',
          name: 'Assistant',
          slug: 'assistant',
          createdUserId: 'member-1',
          memberIds: [],
        }),
      }),
    },
    AgentServer: {
      findOne: () => ({
        lean: async () => server || null,
      }),
    },
  }) as any;

const ownerUser = { _id: 'owner-1', isOwner: true } as any;
const memberUser = { _id: 'member-1', isOwner: false } as any;

afterEach(() => {
  global.fetch = originalFetch;
  process.env.ERXES_AI_ASSISTANT_RUNTIME_SHARED_SECRET =
    originalEnv.runtimeSecret;
});

test('identifier validation rejects shell injection', () => {
  assert.throws(
    () => assertSafeRuntimeIdentifier('browser; rm -rf /', 'pluginId'),
    /pluginId/,
  );
  assert.equal(assertSafeRuntimeIdentifier('browser', 'pluginId'), 'browser');
});

test('buildPluginInstallIdentifier rejects ambiguous or unsafe plugin values', () => {
  assert.equal(
    buildPluginInstallIdentifier('clawhub:browser-tools'),
    'clawhub:browser-tools',
  );
  assert.equal(
    buildPluginInstallIdentifier('@scope/plugin', '1.2.3'),
    '@scope/plugin@1.2.3',
  );
  assert.throws(
    () => buildPluginInstallIdentifier('https://example.com/plugin.tgz'),
    /plugin/,
  );
  assert.throws(
    () => buildPluginInstallIdentifier('clawhub:browser-tools', '1.2.3'),
    /version is not supported/,
  );
});

test('pending or failed runtime server is rejected', () => {
  assert.throws(
    () => assertApprovedRuntimeServer({ status: 'pending', url: 'https://x' } as any),
    /not approved yet/,
  );
  assert.throws(
    () => assertApprovedRuntimeServer({ status: 'approved', url: '' } as any),
    /URL is not configured/,
  );
});

test('runtime secret is used only in server-side request headers and not returned', async () => {
  process.env.ERXES_AI_ASSISTANT_RUNTIME_SHARED_SECRET = 'server-secret';
  let receivedSecret = '';

  global.fetch = (async (_url: string, init?: RequestInit) => {
    const headers = init?.headers as Record<string, string>;
    receivedSecret = headers['x-erxes-ai-assistant-secret'];

    return new Response(
      JSON.stringify({
        status: 'ready',
        message: 'ok',
        secret: 'server-secret',
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  const payload = await fetchManagedRuntimeOperation('https://runtime', {
    method: 'GET',
    path: '/openclaw/skills',
  });

  assert.equal(receivedSecret, 'server-secret');
  assert.equal(payload.secret, '[REDACTED]');
});

test('non-owner cannot install skills or enable plugins', async () => {
  const models = createManagerModels({
    identifierId: 'assistant-1',
    status: 'approved',
    url: 'https://runtime.example.com',
  });

  await assert.rejects(
    () =>
      assertManagedRuntimeMutationAccess(
        models,
        'assistant-1',
        memberUser,
      ),
    /Only workspace owners may install skills or enable plugins/,
  );
});

test('missing runtime URL is rejected for runtime queries', async () => {
  const result = await callManagedRuntimeOperation({
    models: createModels({
      identifierId: 'assistant-1',
      status: 'approved',
      url: '',
    }),
    user: ownerUser,
    subdomain: 'tenant-a',
    agentId: 'assistant-1',
    operation: 'agentRuntimeSkills',
    request: {
      method: 'GET',
      path: '/openclaw/skills',
    },
    message: 'Managed runtime skills fetched',
    mapResult: (payload) =>
      mapRuntimePayload('Managed runtime skills fetched', payload),
  });

  assert.equal(result.ok, false);
  assert.match(result.records?.error as string, /URL is not configured/);
});

test('install mutation forwards safe identifiers only', async () => {
  process.env.ERXES_AI_ASSISTANT_RUNTIME_SHARED_SECRET = 'server-secret';
  let receivedBody: any = null;

  global.fetch = (async (_url: string, init?: RequestInit) => {
    receivedBody = init?.body ? JSON.parse(String(init.body)) : null;
    return new Response(
      JSON.stringify({
        status: 'ready',
        verification: { installed: true, availableToCurrentAgent: true },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  const result = await callManagedRuntimeOperation({
    models: createModels({
      identifierId: 'assistant-1',
      status: 'approved',
      url: 'https://runtime.example.com',
    }),
    user: ownerUser,
    subdomain: 'tenant-a',
    agentId: 'assistant-1',
    operation: 'agentRuntimeInstallSkill',
    identifier: 'browser-automation',
    requireAdmin: true,
    request: {
      method: 'POST',
      path: '/openclaw/skills/install',
      body: {
        slug: 'browser-automation',
        version: '1.0.0',
      },
    },
    message: 'Managed runtime skill install completed',
    mapResult: (payload) =>
      mapRuntimePayload('Managed runtime skill install completed', payload, {
        records: payload,
      }),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(receivedBody, {
    slug: 'browser-automation',
    version: '1.0.0',
  });
});

test('plugin doctor query handles ok, warning, and failure states', async () => {
  process.env.ERXES_AI_ASSISTANT_RUNTIME_SHARED_SECRET = 'server-secret';

  const models = createModels({
    identifierId: 'assistant-1',
    status: 'approved',
    url: 'https://runtime.example.com',
  });

  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        status: 'ready',
        pluginDoctor: { ok: true, warnings: [] },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )) as typeof fetch;

  const okResult = await callManagedRuntimeOperation({
    models,
    user: ownerUser,
    subdomain: 'tenant-a',
    agentId: 'assistant-1',
    operation: 'agentRuntimePluginDoctor',
    request: {
      method: 'POST',
      path: '/openclaw/plugins/doctor',
      body: {},
    },
    message: 'Managed runtime plugin doctor completed',
    mapResult: (payload) =>
      mapRuntimePayload('Managed runtime plugin doctor completed', payload, {
        diagnostics: payload.pluginDoctor as Record<string, unknown>,
      }),
  });
  assert.equal(okResult.ok, true);
  assert.deepEqual(okResult.warnings, []);

  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        status: 'ready',
        pluginDoctor: { ok: true, warnings: ['warn'] },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )) as typeof fetch;

  const warningResult = await callManagedRuntimeOperation({
    models,
    user: ownerUser,
    subdomain: 'tenant-a',
    agentId: 'assistant-1',
    operation: 'agentRuntimePluginDoctor',
    request: {
      method: 'POST',
      path: '/openclaw/plugins/doctor',
      body: {},
    },
    message: 'Managed runtime plugin doctor completed',
    mapResult: (payload) =>
      mapRuntimePayload('Managed runtime plugin doctor completed', payload, {
        diagnostics: payload.pluginDoctor as Record<string, unknown>,
      }),
  });
  assert.equal(warningResult.ok, true);
  assert.deepEqual(warningResult.warnings, ['warn']);

  global.fetch = (async () =>
    new Response(JSON.stringify({ error: 'doctor failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;

  const failedResult = await callManagedRuntimeOperation({
    models,
    user: ownerUser,
    subdomain: 'tenant-a',
    agentId: 'assistant-1',
    operation: 'agentRuntimePluginDoctor',
    request: {
      method: 'POST',
      path: '/openclaw/plugins/doctor',
      body: {},
    },
    message: 'Managed runtime plugin doctor completed',
    mapResult: (payload) =>
      mapRuntimePayload('Managed runtime plugin doctor completed', payload, {
        diagnostics: payload.pluginDoctor as Record<string, unknown>,
      }),
  });
  assert.equal(failedResult.ok, false);
  assert.equal(failedResult.status, 'failed');
});

test('runtime secret redaction helper removes obvious secret values', () => {
  const redacted = redactSecrets({
    token: 'abc',
    nested: { message: 'Bearer abc.def.ghi' },
  });

  assert.equal(redacted.token, '[REDACTED]');
  assert.equal(redacted.nested.message, '[REDACTED]');
});

test('mapRuntimePayload keeps a structured failed result', () => {
  const result = mapRuntimePayload('runtime failed', {
    status: 'failed',
    error: 'boom',
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 'failed');
  assert.equal(result.message, 'runtime failed');
});
