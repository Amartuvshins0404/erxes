// Phase 3 — background owner-token resolution. resolveBackgroundToken mints a
// short-lived owner token via core's `users.issueRunToken` and falls back to
// undefined (caller → app token) whenever the owner or the erxes app token is
// missing, or the mint fails. The app token is passed only as the client
// credential authenticating to core — never as the minted principal.
const sendTRPCMessage = jest.fn();
jest.mock('erxes-api-shared/utils', () => ({
  sendTRPCMessage: (...args: unknown[]) => sendTRPCMessage(...args),
}));

import { resolveBackgroundToken } from '../runToken';

const APP_TOKEN = 'sk_app-token';

describe('resolveBackgroundToken', () => {
  beforeEach(() => {
    sendTRPCMessage.mockReset();
  });

  it('mints the owner token when owner + app token are present', async () => {
    sendTRPCMessage.mockResolvedValue({ token: 'MINTED' });

    const token = await resolveBackgroundToken(
      { createdBy: 'user-1' },
      'os',
      APP_TOKEN,
    );

    expect(token).toBe('MINTED');
    expect(sendTRPCMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        subdomain: 'os',
        pluginName: 'core',
        module: 'users',
        action: 'issueRunToken',
        method: 'mutation',
        input: { userId: 'user-1', appToken: APP_TOKEN },
      }),
    );
  });

  it('prefers ownerUserId over createdBy', async () => {
    sendTRPCMessage.mockResolvedValue({ token: 'MINTED' });

    await resolveBackgroundToken(
      { ownerUserId: 'owner-9', createdBy: 'user-1' },
      'os',
      APP_TOKEN,
    );

    expect(sendTRPCMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        input: { userId: 'owner-9', appToken: APP_TOKEN },
      }),
    );
  });

  it('returns undefined when the agent has no owner', async () => {
    const token = await resolveBackgroundToken({}, 'os', APP_TOKEN);
    expect(token).toBeUndefined();
    expect(sendTRPCMessage).not.toHaveBeenCalled();
  });

  it('returns undefined when the app token is unset', async () => {
    const token = await resolveBackgroundToken(
      { createdBy: 'user-1' },
      'os',
      undefined,
    );

    expect(token).toBeUndefined();
    expect(sendTRPCMessage).not.toHaveBeenCalled();
  });

  it('returns undefined when the TRPC call throws', async () => {
    sendTRPCMessage.mockRejectedValue(new Error('core unreachable'));

    const token = await resolveBackgroundToken(
      { createdBy: 'user-1' },
      'os',
      APP_TOKEN,
    );

    expect(token).toBeUndefined();
  });

  it('returns undefined when the mint returns no token', async () => {
    sendTRPCMessage.mockResolvedValue(null);

    const token = await resolveBackgroundToken(
      { createdBy: 'user-1' },
      'os',
      APP_TOKEN,
    );

    expect(token).toBeUndefined();
  });
});
