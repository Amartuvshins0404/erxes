const sendTRPCMessage = jest.fn();
jest.mock('erxes-api-shared/utils', () => ({
  sendTRPCMessage: (...args: unknown[]) => sendTRPCMessage(...args),
}));

import { mintRunToken } from '../runToken';

const APP_TOKEN = 'existing-erxes-app-token';
const account = (overrides: Record<string, unknown> = {}) => ({
  _id: 'agent-user-1',
  role: 'user',
  isOwner: false,
  isActive: true,
  appId: 'erxes-agent:agent-profile-1',
  ...overrides,
});

describe('mintRunToken', () => {
  beforeEach(() => {
    sendTRPCMessage.mockReset().mockResolvedValue({ token: 'MINTED' });
  });

  it('asks core to mint a token with the existing erxes App credential', async () => {
    await expect(
      mintRunToken({
        account: account(),
        subdomain: 'os',
        appToken: APP_TOKEN,
      }),
    ).resolves.toBe('MINTED');

    expect(sendTRPCMessage).toHaveBeenCalledWith({
      subdomain: 'os',
      pluginName: 'core',
      module: 'users',
      action: 'issueRunToken',
      method: 'mutation',
      input: {
        userId: 'agent-user-1',
        appToken: APP_TOKEN,
      },
      defaultValue: null,
    });
  });

  it.each([
    ['ordinary human', { appId: undefined }, APP_TOKEN],
    ['owner', { isOwner: true }, APP_TOKEN],
    ['inactive account', { isActive: false }, APP_TOKEN],
    ['empty account id', { _id: ' ' }, APP_TOKEN],
    ['missing App token', {}, undefined],
    ['blank App token', {}, ' '],
  ])('refuses an %s principal', async (_label, overrides, appToken) => {
    await expect(
      mintRunToken({
        account: account(overrides),
        subdomain: 'os',
        appToken,
      }),
    ).resolves.toBeUndefined();
    expect(sendTRPCMessage).not.toHaveBeenCalled();
  });

  it.each([null, {}, { token: '' }, { token: 42 }])(
    'fails closed on an invalid core response',
    async (response) => {
      sendTRPCMessage.mockResolvedValue(response);

      await expect(
        mintRunToken({
          account: account(),
          subdomain: 'os',
          appToken: APP_TOKEN,
        }),
      ).resolves.toBeUndefined();
    },
  );

  it('fails closed when core token issuance fails', async () => {
    sendTRPCMessage.mockRejectedValue(new Error('core unavailable'));

    await expect(
      mintRunToken({
        account: account(),
        subdomain: 'os',
        appToken: APP_TOKEN,
      }),
    ).resolves.toBeUndefined();
  });
});
