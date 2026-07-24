import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import {
  fetchManagedLlmModels,
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
  });
});

test('resolveManagedLlmConnection rejects a model from another provider', () => {
  assert.throws(
    () => resolveManagedLlmConnection('openai', 'anthropic/claude-opus-4-6'),
    /selected LLM provider/,
  );
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
