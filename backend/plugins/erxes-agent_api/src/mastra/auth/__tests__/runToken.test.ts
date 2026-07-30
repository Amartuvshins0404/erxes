const redisSet = jest.fn();
jest.mock('erxes-api-shared/utils', () => ({
  redis: { set: (...args: unknown[]) => redisSet(...args) },
}));

import jwt from 'jsonwebtoken';
import { mintRunToken } from '../runToken';

const account = (overrides: Record<string, unknown> = {}) => ({
  _id: 'agent-user-1',
  role: 'user',
  isOwner: false,
  isActive: true,
  appId: 'erxes-agent:agent-profile-1',
  ...overrides,
});

const originalEnv = process.env;

describe('mintRunToken', () => {
  beforeEach(() => {
    redisSet.mockReset().mockResolvedValue('OK');
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      JWT_TOKEN_SECRET: 'agent-run-token-test-secret',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('mints and registers a one-hour gateway token for the linked core account', async () => {
    const token = await mintRunToken({ account: account() });

    expect(token).toEqual(expect.any(String));
    expect(jwt.verify(token as string, 'agent-run-token-test-secret')).toEqual(
      expect.objectContaining({
        user: { _id: 'agent-user-1', isOwner: false },
      }),
    );
    expect(redisSet).toHaveBeenCalledWith(
      `user-token-agent-user-1-${token}`,
      '1',
      'EX',
      3600,
    );
  });

  it.each([
    ['ordinary human', { appId: undefined }],
    ['owner', { isOwner: true }],
    ['inactive account', { isActive: false }],
    ['empty account id', { _id: ' ' }],
  ])('refuses an %s principal', async (_label, overrides) => {
    await expect(
      mintRunToken({ account: account(overrides) }),
    ).resolves.toBeUndefined();
    expect(redisSet).not.toHaveBeenCalled();
  });

  it('fails closed when token registration fails', async () => {
    redisSet.mockRejectedValue(new Error('redis unavailable'));

    await expect(mintRunToken({ account: account() })).resolves.toBeUndefined();
  });

  it('fails closed in production when the shared JWT secret is not configured', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_TOKEN_SECRET;

    await expect(mintRunToken({ account: account() })).resolves.toBeUndefined();
    expect(redisSet).not.toHaveBeenCalled();
  });
});
