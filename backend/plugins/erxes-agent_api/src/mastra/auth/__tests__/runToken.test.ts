// Phase 3 — background owner-token resolution. resolveBackgroundToken mints a
// short-lived owner token via core's `users.issueRunToken` and falls back to
// undefined (caller → app token) whenever the owner or the shared secret is
// missing, or the mint fails.
const sendTRPCMessage = jest.fn();
jest.mock('erxes-api-shared/utils', () => ({
  sendTRPCMessage: (...args: unknown[]) => sendTRPCMessage(...args),
}));

import { resolveBackgroundToken } from '../runToken';

const SECRET = 'shared-run-secret';

describe('resolveBackgroundToken', () => {
  beforeEach(() => {
    sendTRPCMessage.mockReset();
    process.env.ERXES_AGENT_RUN_TOKEN_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.ERXES_AGENT_RUN_TOKEN_SECRET;
  });

  it('mints the owner token when owner + secret are present', async () => {
    sendTRPCMessage.mockResolvedValue({ token: 'MINTED' });

    const token = await resolveBackgroundToken(
      { createdBy: 'user-1' },
      'os',
    );

    expect(token).toBe('MINTED');
    expect(sendTRPCMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        subdomain: 'os',
        pluginName: 'core',
        module: 'users',
        action: 'issueRunToken',
        method: 'mutation',
        input: { userId: 'user-1', secret: SECRET },
      }),
    );
  });

  it('prefers ownerUserId over createdBy', async () => {
    sendTRPCMessage.mockResolvedValue({ token: 'MINTED' });

    await resolveBackgroundToken(
      { ownerUserId: 'owner-9', createdBy: 'user-1' },
      'os',
    );

    expect(sendTRPCMessage).toHaveBeenCalledWith(
      expect.objectContaining({ input: { userId: 'owner-9', secret: SECRET } }),
    );
  });

  it('returns undefined when the agent has no owner', async () => {
    const token = await resolveBackgroundToken({}, 'os');
    expect(token).toBeUndefined();
    expect(sendTRPCMessage).not.toHaveBeenCalled();
  });

  it('returns undefined when the secret is unset', async () => {
    delete process.env.ERXES_AGENT_RUN_TOKEN_SECRET;

    const token = await resolveBackgroundToken({ createdBy: 'user-1' }, 'os');

    expect(token).toBeUndefined();
    expect(sendTRPCMessage).not.toHaveBeenCalled();
  });

  it('returns undefined when the TRPC call throws', async () => {
    sendTRPCMessage.mockRejectedValue(new Error('core unreachable'));

    const token = await resolveBackgroundToken({ createdBy: 'user-1' }, 'os');

    expect(token).toBeUndefined();
  });

  it('returns undefined when the mint returns no token', async () => {
    sendTRPCMessage.mockResolvedValue(null);

    const token = await resolveBackgroundToken({ createdBy: 'user-1' }, 'os');

    expect(token).toBeUndefined();
  });
});
