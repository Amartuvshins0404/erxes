/**
 * Provider listing errors shown to users: provider messages are stripped of
 * keys and credential-shaped tokens, and unreadable stored keys name the
 * server-side reason without revealing anything about the key.
 */

import {
  describeUnreadableKey,
  sanitizeProviderMessage,
} from '@/agents/providerModels';

describe('sanitizeProviderMessage', () => {
  it('removes the key, masked key fragments and long tokens but keeps model ids', () => {
    const key = 'sk-proj-abcdefghijklmnopqrstuvwxyz0123456789';

    expect(
      sanitizeProviderMessage(
        `Incorrect API key provided: ${key}. Masked sk-proj-****6789 and xai-AbC123 too.`,
        key,
      ),
    ).toBe('Incorrect API key provided: <key>. Masked <key> and <key> too.');
    expect(
      sanitizeProviderMessage(
        'Token ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 rejected for gpt-4o-mini-realtime-preview-2024-12-17',
        'unrelated',
      ),
    ).toBe(
      'Token <redacted> rejected for gpt-4o-mini-realtime-preview-2024-12-17',
    );
  });

  it('truncates long messages and ignores non-strings', () => {
    expect(sanitizeProviderMessage('x '.repeat(300), 'k').length).toBe(200);
    expect(sanitizeProviderMessage({ nested: true }, 'k')).toBe('');
  });
});

describe('describeUnreadableKey', () => {
  const original = process.env.ERXES_MASTER_KEY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ERXES_MASTER_KEY;
    } else {
      process.env.ERXES_MASTER_KEY = original;
    }
  });

  it('distinguishes a missing key from an unconfigured or changed master key', () => {
    delete process.env.ERXES_MASTER_KEY;
    expect(describeUnreadableKey('kimi-code', 'unreadable')).toContain(
      "key encryption isn't configured on this server (ERXES_MASTER_KEY)",
    );

    process.env.ERXES_MASTER_KEY = 'another-master-key';
    expect(describeUnreadableKey('kimi-code', 'unreadable')).toBe(
      "The saved Kimi Code key can't be decrypted on this server (its encryption key changed). Re-enter it in Settings → Connections.",
    );
    expect(describeUnreadableKey('openai', 'missing')).toBe(
      'No OpenAI API key is saved. Add it in Settings → Connections.',
    );
  });
});
