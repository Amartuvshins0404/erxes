// Proves the provider WRITE path treats apiKey as write-only: a blank key is
// dropped from the update so the stored secret is preserved (the masked UI
// submits an empty key when the admin doesn't re-type it), while a real key
// replaces it.
//
// Also pins the index contract: saveProvider must run ZERO runtime DDL
// (syncIndexes in the hot path is what made mastraProviderSave hang 10s on a
// buffering connection); the tenant-scoped uniqueness lives solely as a schema
// declaration that Mongoose auto-indexes once per model.
import {
  buildProviderUpdate,
  loadProviderClass,
  type ProviderOwner,
} from '@/provider/db/models/Provider';
import { providerSchema } from '@/provider/db/definitions/provider';
import type { IMastraProvider } from '@/provider/@types/provider';
import type { IModels } from '~/connectionResolvers';

const makeFakeModel = () => {
  const syncIndexes = jest.fn();
  const model = {
    syncIndexes,
    findOne: jest.fn().mockResolvedValue(null),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    create: jest.fn().mockResolvedValue({}),
  };
  return { syncIndexes, model };
};

describe('saveProvider hot path', () => {
  it('persists a provider without running any index synchronization', async () => {
    const { syncIndexes, model } = makeFakeModel();
    loadProviderClass({
      MastraProvider: model,
    } as unknown as IModels);

    const owner: ProviderOwner = { scope: 'organization', ownerId: null };
    const doc: IMastraProvider = { provider: 'openai', label: 'OpenAI' };

    const saveProvider = providerSchema.statics.saveProvider as unknown as (
      doc: IMastraProvider,
      owner: ProviderOwner,
    ) => Promise<unknown>;

    await saveProvider(doc, owner);

    expect(syncIndexes).not.toHaveBeenCalled();
    expect(model.create).toHaveBeenCalledTimes(1);
    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'openai' }),
    );
  });
});

describe('provider uniqueness contract', () => {
  it('declares the tenant-scoped unique compound index for auto-indexing', () => {
    const declared = providerSchema
      .indexes()
      .some(
        ([keys, options]) =>
          keys.provider === 1 && keys.ownerId === 1 && options?.unique === true,
      );

    expect(declared).toBe(true);
  });
});

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
    const update = buildProviderUpdate({
      provider: 'openai',
      isEnabled: false,
    });
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
