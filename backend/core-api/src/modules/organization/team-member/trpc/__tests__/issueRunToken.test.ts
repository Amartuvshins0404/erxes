import * as jwt from 'jsonwebtoken';

// Redis is the gateway-checked side effect. Capture every set() so we can
// assert the exact key/TTL the gateway looks up.
const redisStore: Record<string, unknown> = {};
const mockRedisSet = jest.fn(
  (key: string, value: unknown, ..._rest: unknown[]) => {
    redisStore[key] = value;
    return Promise.resolve('OK');
  },
);

jest.mock('erxes-api-shared/utils', () => ({
  redis: {
    set: (...args: unknown[]) => mockRedisSet(...(args as [string, unknown])),
  },
}));

// user.ts only imports `CoreTRPCContext` (a type) from ~/init-trpc; stub the
// module so its heavy runtime import graph (connectionResolvers, models) never
// loads under isolatedModules.
jest.mock('~/init-trpc', () => ({}));

import { userTrpcRouter } from '../user';

const GATEWAY_SECRET = 'gateway-jwt-secret';
// A representative erxes App token (sk_ + 48 hex, per Apps.createApp).
const APP_TOKEN =
  'sk_0123456789abcdef0123456789abcdef0123456789abcdef';

// The Apps lookup is tenant-scoped (ctx.models). It returns the ACTIVE app doc
// only when the queried token matches AND status:'active' — mirroring the
// gateway's `findOne({ token, status:'active' })`.
const makeApps = () => ({
  findOne: jest.fn(
    ({ token, status }: { token: string; status: string }) =>
      Promise.resolve(
        token === APP_TOKEN && status === 'active'
          ? { _id: 'app-1', token: APP_TOKEN, status: 'active' }
          : null,
      ),
  ),
});

const makeCtx = (userFindOne: jest.Mock, apps = makeApps()) =>
  ({
    subdomain: 'test',
    models: { Users: { findOne: userFindOne }, Apps: apps },
  }) as any;

describe('users.issueRunToken', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    for (const k of Object.keys(redisStore)) delete redisStore[k];
    process.env = { ...OLD_ENV };
    process.env.JWT_TOKEN_SECRET = GATEWAY_SECRET;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('mints a gateway-verifiable token + Redis key for an active, bounded (non-org-owner) owner', async () => {
    const findOne = jest.fn().mockResolvedValue({
      _id: 'owner-1',
      isOwner: false,
      isActive: true,
    });
    const caller = userTrpcRouter.createCaller(makeCtx(findOne));

    const res = await caller.users.issueRunToken({
      userId: 'owner-1',
      appToken: APP_TOKEN,
    });

    expect(res).not.toBeNull();
    const token = (res as { token: string }).token;
    expect(typeof token).toBe('string');

    // Only active owners are eligible.
    expect(findOne).toHaveBeenCalledWith({
      _id: 'owner-1',
      isActive: { $ne: false },
    });

    // The token verifies with the gateway's secret resolution and carries _id.
    const decoded = jwt.verify(token, GATEWAY_SECRET) as {
      user: { _id: string; isOwner?: boolean };
    };
    expect(decoded.user._id).toBe('owner-1');
    expect(decoded.user.isOwner).toBe(false);

    // The exact key + 1h TTL the gateway checks.
    expect(mockRedisSet).toHaveBeenCalledWith(
      'user_token_owner-1_' + token,
      1,
      'EX',
      3600,
    );
  });

  it('returns null for an org owner (isOwner) — run tokens must be bounded, never god-mode', async () => {
    const findOne = jest.fn().mockResolvedValue({
      _id: 'org-owner',
      isOwner: true,
      isActive: true,
    });
    const caller = userTrpcRouter.createCaller(makeCtx(findOne));

    const res = await caller.users.issueRunToken({
      userId: 'org-owner',
      appToken: APP_TOKEN,
    });

    expect(res).toBeNull();
    expect(mockRedisSet).not.toHaveBeenCalled();
  });

  it('returns null for an unknown/invalid app token without hitting Users or Redis', async () => {
    const findOne = jest.fn();
    const caller = userTrpcRouter.createCaller(makeCtx(findOne));

    const res = await caller.users.issueRunToken({
      userId: 'owner-1',
      appToken: 'sk_not-a-real-token',
    });

    expect(res).toBeNull();
    expect(findOne).not.toHaveBeenCalled();
    expect(mockRedisSet).not.toHaveBeenCalled();
  });

  it('returns null for a revoked app token (findOne(status:active) misses)', async () => {
    // A revoked app is not status:'active', so the tenant-scoped lookup returns
    // null exactly like an unknown token — never revealing which it was.
    const apps = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const findOne = jest.fn();
    const caller = userTrpcRouter.createCaller(makeCtx(findOne, apps));

    const res = await caller.users.issueRunToken({
      userId: 'owner-1',
      appToken: APP_TOKEN,
    });

    expect(res).toBeNull();
    expect(apps.findOne).toHaveBeenCalledWith({
      token: APP_TOKEN,
      status: 'active',
    });
    expect(findOne).not.toHaveBeenCalled();
    expect(mockRedisSet).not.toHaveBeenCalled();
  });

  it('returns null for an inactive or unknown owner', async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    const caller = userTrpcRouter.createCaller(makeCtx(findOne));

    const res = await caller.users.issueRunToken({
      userId: 'ghost',
      appToken: APP_TOKEN,
    });

    expect(res).toBeNull();
    expect(findOne).toHaveBeenCalled();
    expect(mockRedisSet).not.toHaveBeenCalled();
  });
});
