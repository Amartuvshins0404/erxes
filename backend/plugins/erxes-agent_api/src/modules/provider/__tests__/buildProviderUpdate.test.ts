// Proves the provider WRITE path treats apiKey as write-only: a blank key is
// dropped from the update so the stored secret is preserved (the masked UI
// submits an empty key when the admin doesn't re-type it), while a real key
// replaces it.
import { buildProviderUpdate } from '@/provider/db/models/Provider';

describe('buildProviderUpdate (write-only apiKey)', () => {
  it('drops a blank apiKey so the existing stored secret is kept', () => {
    const update = buildProviderUpdate({
      provider: 'openai',
      label: 'OpenAI',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
    });

    expect(update).not.toHaveProperty('apiKey');
    expect(update.provider).toBe('openai');
    expect(update.baseUrl).toBe('https://api.openai.com/v1');
  });

  it('drops a whitespace-only apiKey', () => {
    const update = buildProviderUpdate({ provider: 'openai', apiKey: '   ' });
    expect(update).not.toHaveProperty('apiKey');
  });

  it('sets a trimmed apiKey when a real value is provided', () => {
    const update = buildProviderUpdate({
      provider: 'openai',
      apiKey: '  sk-new-key-9999  ',
    });
    expect(update.apiKey).toBe('sk-new-key-9999');
  });

  it('drops apiKey entirely when omitted (undefined)', () => {
    const update = buildProviderUpdate({ provider: 'openai', isEnabled: false });
    expect(update).not.toHaveProperty('apiKey');
    expect(update.isEnabled).toBe(false);
  });
});

describe('buildProviderUpdate (write-only headers)', () => {
  it('drops an empty headers map so stored headers are kept', () => {
    const update = buildProviderUpdate({ provider: 'openai', headers: {} });
    expect(update).not.toHaveProperty('headers');
  });

  it('drops headers entirely when omitted (undefined)', () => {
    const update = buildProviderUpdate({ provider: 'openai' });
    expect(update).not.toHaveProperty('headers');
  });

  it('sets headers when a non-empty map is provided', () => {
    const headers = { Authorization: 'Bearer secret-xyz' };
    const update = buildProviderUpdate({ provider: 'openai', headers });
    expect(update.headers).toEqual(headers);
  });

  it('keeps apiKey and headers independent (blank key, new headers)', () => {
    const update = buildProviderUpdate({
      provider: 'openai',
      apiKey: '',
      headers: { 'User-Agent': 'claude-cli/1.0' },
    });
    expect(update).not.toHaveProperty('apiKey');
    expect(update.headers).toEqual({ 'User-Agent': 'claude-cli/1.0' });
  });
});
