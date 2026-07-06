// Resolver-level tests for the Chimege voice save mutation. The mutation must
// validate + normalise the bring-your-own-key tokens before they are persisted,
// so a bogus paste (e.g. a Cyrillic sentence) is rejected at save time rather
// than blowing up later at fetch() with an opaque ByteString error.
//
// resolveVoiceStatusForTenant reaches the DB/env (and pulls in the heavy
// connectionResolvers import graph), so it is mocked; the assertions only care
// about what the mutation hands to saveVoiceConfig.
jest.mock('~/mastra/voice/resolveConfig', () => ({
  resolveVoiceStatusForTenant: jest.fn(async () => ({
    isEnabled: true,
    sttSource: 'db',
    ttsSource: 'db',
    voice: 'FEMALE3v2',
    sampleRate: 22050,
  })),
}));

import { voiceMutations } from '../voice';

function makeContext() {
  const saveVoiceConfig = jest.fn(async (doc: unknown) => doc);
  const checkPermission = jest.fn(async () => undefined);
  const context = {
    subdomain: 'test',
    checkPermission,
    models: { MastraVoiceConfig: { saveVoiceConfig } },
  } as never;
  return { context, saveVoiceConfig, checkPermission };
}

const save = (doc: Record<string, unknown>, context: never) =>
  voiceMutations.mastraVoiceConfigSave(undefined, { doc } as never, context);

describe('mastraVoiceConfigSave (token validation)', () => {
  it('rejects a Cyrillic sttToken and never persists it', async () => {
    const { context, saveVoiceConfig } = makeContext();
    await expect(save({ sttToken: 'Сайн байна уу' }, context)).rejects.toThrow(
      /doesn't look like a Chimege STT token/,
    );
    expect(saveVoiceConfig).not.toHaveBeenCalled();
  });

  it('rejects a ttsToken containing whitespace and never persists it', async () => {
    const { context, saveVoiceConfig } = makeContext();
    await expect(save({ ttsToken: 'abc 123 def' }, context)).rejects.toThrow(
      /doesn't look like a Chimege TTS token/,
    );
    expect(saveVoiceConfig).not.toHaveBeenCalled();
  });

  it('trims a padded valid sttToken before saving', async () => {
    const { context, saveVoiceConfig } = makeContext();
    await save({ sttToken: '  a1b2c3d4e5f6  ' }, context);
    expect(saveVoiceConfig).toHaveBeenCalledTimes(1);
    expect(saveVoiceConfig.mock.calls[0][0]).toMatchObject({
      sttToken: 'a1b2c3d4e5f6',
    });
  });

  it('leaves an empty-string token untouched so clear/keep semantics are preserved', async () => {
    const { context, saveVoiceConfig } = makeContext();
    await save({ sttToken: '', ttsVoice: 'FEMALE3v2' }, context);
    expect(saveVoiceConfig).toHaveBeenCalledTimes(1);
    // Empty passes straight through — saveVoiceConfig decides keep-vs-clear.
    expect(saveVoiceConfig.mock.calls[0][0]).toMatchObject({ sttToken: '' });
  });
});
