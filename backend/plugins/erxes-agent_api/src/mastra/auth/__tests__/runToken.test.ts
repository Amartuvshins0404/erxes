// Step 22 — run-token minting for the agent's SERVICE USER. mintRunToken issues a
// short-lived token via core's `users.issueRunToken` and returns undefined
// (caller → fail closed) whenever the userId or the erxes app token is missing,
// or the mint fails. The app token is passed only as the client credential
// authenticating to core — never as the minted principal.
const sendTRPCMessage = jest.fn();
jest.mock('erxes-api-shared/utils', () => ({
  sendTRPCMessage: (...args: unknown[]) => sendTRPCMessage(...args),
}));

import { mintRunToken } from '../runToken';

const APP_TOKEN = 'sk_app-token';

describe('mintRunToken', () => {
  beforeEach(() => {
    sendTRPCMessage.mockReset();
  });

  it('mints the run token when userId + app token are present', async () => {
    sendTRPCMessage.mockResolvedValue({ token: 'MINTED' });

    const token = await mintRunToken({
      userId: 'svc-1',
      subdomain: 'os',
      appToken: APP_TOKEN,
    });

    expect(token).toBe('MINTED');
    expect(sendTRPCMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        subdomain: 'os',
        pluginName: 'core',
        module: 'users',
        action: 'issueRunToken',
        method: 'mutation',
        input: { userId: 'svc-1', appToken: APP_TOKEN },
      }),
    );
  });

  it('returns undefined when the userId is empty', async () => {
    const token = await mintRunToken({
      userId: '  ',
      subdomain: 'os',
      appToken: APP_TOKEN,
    });
    expect(token).toBeUndefined();
    expect(sendTRPCMessage).not.toHaveBeenCalled();
  });

  it('returns undefined when the app token is unset', async () => {
    const token = await mintRunToken({
      userId: 'svc-1',
      subdomain: 'os',
      appToken: undefined,
    });
    expect(token).toBeUndefined();
    expect(sendTRPCMessage).not.toHaveBeenCalled();
  });

  it('returns undefined when the TRPC call throws', async () => {
    sendTRPCMessage.mockRejectedValue(new Error('core unreachable'));

    const token = await mintRunToken({
      userId: 'svc-1',
      subdomain: 'os',
      appToken: APP_TOKEN,
    });

    expect(token).toBeUndefined();
  });

  it('returns undefined when the mint returns no token (deactivated / revoked)', async () => {
    sendTRPCMessage.mockResolvedValue(null);

    const token = await mintRunToken({
      userId: 'svc-1',
      subdomain: 'os',
      appToken: APP_TOKEN,
    });

    expect(token).toBeUndefined();
  });
});
