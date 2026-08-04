import { buildSettingsUpdate } from '@/settings/db/models/Settings';
import { toPublicSettings } from '@/settings/publicSettings';

const ORIGINAL_API_KEY = process.env.OPEN_SANDBOX_API_KEY;
const ORIGINAL_DOMAIN = process.env.OPEN_SANDBOX_DOMAIN;
const ORIGINAL_PROTOCOL = process.env.OPEN_SANDBOX_PROTOCOL;

afterEach(() => {
  if (ORIGINAL_API_KEY === undefined) delete process.env.OPEN_SANDBOX_API_KEY;
  else process.env.OPEN_SANDBOX_API_KEY = ORIGINAL_API_KEY;
  if (ORIGINAL_DOMAIN === undefined) delete process.env.OPEN_SANDBOX_DOMAIN;
  else process.env.OPEN_SANDBOX_DOMAIN = ORIGINAL_DOMAIN;
  if (ORIGINAL_PROTOCOL === undefined) delete process.env.OPEN_SANDBOX_PROTOCOL;
  else process.env.OPEN_SANDBOX_PROTOCOL = ORIGINAL_PROTOCOL;
});

describe('settings secrets', () => {
  it('preserves a stored key when the settings form submits blank', () => {
    expect(
      buildSettingsUpdate({
        openSandboxApiUrl: ' https://sandbox.example.com/ ',
        openSandboxApiKey: '   ',
      }),
    ).toEqual({ openSandboxApiUrl: 'https://sandbox.example.com' });
  });

  it('trims a newly supplied key before persistence', () => {
    expect(
      buildSettingsUpdate({ openSandboxApiKey: '  sandbox-secret-1234  ' }),
    ).toEqual({ openSandboxApiKey: 'sandbox-secret-1234' });
  });

  it('never exposes raw stored secrets through the public projection', () => {
    const publicSettings = toPublicSettings({
      evaluationDsn: 'https://public:langfuse-secret@example.com',
      openSandboxApiUrl: 'https://sandbox.example.com',
      openSandboxApiKey: 'sandbox-secret-1234',
    });

    expect(publicSettings).not.toHaveProperty('evaluationDsn');
    expect(publicSettings.evaluationDsnConfigured).toBe(true);
    expect(publicSettings).not.toHaveProperty('openSandboxApiKey');
    expect(publicSettings.hasOpenSandboxApiKey).toBe(true);
    expect(publicSettings.openSandboxApiKeyHint).toBe('••••1234');
    expect(JSON.stringify(publicSettings)).not.toContain('langfuse-secret');
    expect(JSON.stringify(publicSettings)).not.toContain('sandbox-secret-1234');
  });

  it('constructs the public API URL from the OpenSandbox host environment', () => {
    process.env.OPEN_SANDBOX_DOMAIN = 'sandbox.example.com';
    process.env.OPEN_SANDBOX_PROTOCOL = 'https';
    process.env.OPEN_SANDBOX_API_KEY = 'environment-secret';

    const publicSettings = toPublicSettings({});

    expect(publicSettings.openSandboxApiUrl).toBe(
      'https://sandbox.example.com',
    );
    expect(publicSettings.hasOpenSandboxApiKey).toBe(true);
  });
});
