import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import {
  fetchManagedLlmModels,
  managedLlmSubscriptionNeedsToken,
  managedLlmSubscriptionUsesDeviceCode,
  resolveManagedLlmCredentialMode,
  resolveManagedLlmConnection,
} from './managedLlmProviders';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

test('resolveManagedLlmConnection accepts live models from the selected provider', () => {
  assert.deepEqual(resolveManagedLlmConnection('openai', 'openai/gpt-5.4'), {
    provider: 'openai',
    model: 'openai/gpt-5.4',
    credentialMode: 'api_key',
  });
});

test('resolveManagedLlmConnection rejects a model from another provider', () => {
  assert.throws(
    () => resolveManagedLlmConnection('openai', 'anthropic/claude-opus-4-6'),
    /selected LLM provider/,
  );
  assert.throws(
    () => resolveManagedLlmConnection('openai', 'openai/'),
    /selected LLM provider/,
  );
});

test('subscription mode supports OpenClaw subscription providers but not Gemini OAuth', () => {
  assert.deepEqual(
    resolveManagedLlmConnection('openai', undefined, 'subscription'),
    {
      provider: 'openai',
      model: 'openai/gpt-5.6-sol',
      credentialMode: 'subscription',
    },
  );
  assert.equal(
    resolveManagedLlmConnection('anthropic', undefined, 'subscription').model,
    'anthropic/claude-sonnet-4-6',
  );
  assert.equal(
    resolveManagedLlmConnection('github-copilot', undefined, 'subscription')
      .model,
    'github-copilot/claude-opus-4.7',
  );
  assert.equal(
    resolveManagedLlmConnection('minimax-portal', undefined, 'subscription')
      .model,
    'minimax-portal/MiniMax-M3',
  );
  assert.equal(
    resolveManagedLlmConnection('qwen', undefined, 'subscription').model,
    'qwen/qwen3.7-plus',
  );
  assert.equal(
    resolveManagedLlmConnection('zai', undefined, 'subscription').model,
    'zai/glm-5.2',
  );
  assert.equal(managedLlmSubscriptionUsesDeviceCode('openai'), true);
  assert.equal(managedLlmSubscriptionUsesDeviceCode('github-copilot'), true);
  assert.equal(managedLlmSubscriptionUsesDeviceCode('minimax-portal'), true);
  assert.equal(managedLlmSubscriptionNeedsToken('anthropic'), true);
  assert.equal(managedLlmSubscriptionNeedsToken('qwen'), true);
  assert.equal(managedLlmSubscriptionNeedsToken('zai'), true);
  assert.throws(
    () => resolveManagedLlmConnection('google', undefined, 'subscription'),
    /not supported for this provider/,
  );
  assert.throws(
    () => resolveManagedLlmConnection('qwen', undefined, 'api_key'),
    /Unsupported LLM provider/,
  );
  assert.throws(
    () => resolveManagedLlmConnection('github-copilot', undefined, 'api_key'),
    /Unsupported LLM provider/,
  );
  assert.throws(
    () =>
      resolveManagedLlmConnection(
        'anthropic',
        'anthropic/claude-opus-4-6',
        'subscription',
      ),
    /supported subscription model/,
  );
  assert.equal(resolveManagedLlmCredentialMode(), 'api_key');
  assert.throws(() => resolveManagedLlmCredentialMode('oauth'));
});

test('fetchManagedLlmModels loads, prefixes, de-duplicates, and sorts live models', async () => {
  global.fetch = async () =>
    new Response(
      JSON.stringify({
        data: [
          { id: 'gpt-5.4', name: 'GPT 5.4' },
          { id: 'gpt-4.1', name: 'GPT 4.1' },
          { id: 'gpt-5.4', name: 'GPT 5.4 duplicate' },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

  const models = await fetchManagedLlmModels('openai', 'test-key');

  assert.deepEqual(models, [
    { id: 'openai/gpt-4.1', name: 'GPT 4.1' },
    { id: 'openai/gpt-5.4', name: 'GPT 5.4' },
  ]);
});

test('fetchManagedLlmModels reports provider authentication failures safely', async () => {
  global.fetch = async () => new Response('unauthorized', { status: 401 });

  await assert.rejects(
    () => fetchManagedLlmModels('anthropic', 'secret-value'),
    (error: unknown) =>
      error instanceof Error &&
      /HTTP 401/.test(error.message) &&
      !error.message.includes('secret-value'),
  );
});
