import {
  evaluationConfigFingerprint,
  isEvaluationEnabled,
  isExportConfigured,
  langfuseConfig,
} from '../config';

describe('runtime evaluation config', () => {
  const evaluationDsn =
    'https://public%20key:secret%2Fkey@langfuse.example.com/observability/';

  it('is enabled only by the persisted tenant setting', () => {
    expect(isEvaluationEnabled({ evaluationEnabled: true })).toBe(true);
    expect(isEvaluationEnabled({ evaluationEnabled: false })).toBe(false);
    expect(isEvaluationEnabled()).toBe(false);
  });

  it('parses the write-only DSN and preserves a path-prefixed host', () => {
    expect(langfuseConfig({ evaluationDsn })).toEqual({
      baseUrl: 'https://langfuse.example.com/observability',
      publicKey: 'public key',
      secretKey: 'secret/key',
    });
    expect(
      isExportConfigured({ evaluationEnabled: true, evaluationDsn }),
    ).toBe(true);
  });

  it('rejects missing credentials and fingerprints secrets without exposing them', () => {
    expect(
      langfuseConfig({ evaluationDsn: 'https://langfuse.example.com' }),
    ).toBeNull();

    const fingerprint = evaluationConfigFingerprint({
      evaluationEnabled: true,
      evaluationDsn,
    });
    expect(fingerprint).toHaveLength(16);
    expect(fingerprint).not.toContain('secret');
    expect(evaluationConfigFingerprint({ evaluationEnabled: false })).toBe(
      'off',
    );
  });
});
