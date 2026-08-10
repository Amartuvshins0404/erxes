/**
 * BLACK-BOX contract test for core configs.getCodes.
 *
 * Contract: getCodes MUST read only the `code` field (i.e. call .distinct('code'))
 * and return that array of names. It must NEVER load config VALUES.
 *
 * Derived from the contract only; not from the implementation source.
 */

// Plumbing mocks so the router module imports without a real trpc/init or fs configs.
jest.mock('~/init-trpc', () => ({}));
jest.mock('@/organization/settings/utils/configs', () => ({
  getFileUploadConfigs: jest.fn(),
}));

import { configTrpcRouter } from '../config';

describe('configs.getCodes — reads only the `code` field', () => {
  const makeCtx = (codes: string[]) => {
    const distinct = jest.fn(async (_field: string) => codes);
    const find = jest.fn((_filter?: any) => ({ distinct }));
    return { ctx: { models: { Configs: { find } } } as any, find, distinct };
  };

  it('calls .distinct("code") and returns the resulting code array', async () => {
    const codes = ['MAIL_HOST', 'CLOUDFLARE_API_TOKEN', 'AWS_REGION'];
    const { ctx, distinct } = makeCtx(codes);

    const result = await configTrpcRouter.createCaller(ctx).configs.getCodes();

    expect(distinct).toHaveBeenCalledWith('code');
    // must NOT read values:
    expect(distinct).not.toHaveBeenCalledWith('value');
    expect(result).toEqual(codes);
  });

  it('returns exactly the distinct("code") array (no value leakage)', async () => {
    const codes = ['SENTRY_DSN', 'MONGO_URL'];
    const { ctx } = makeCtx(codes);

    const result: any = await configTrpcRouter.createCaller(ctx).configs.getCodes();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(codes);
    // returned payload is names only — no accidental { value } objects:
    for (const item of result) {
      expect(typeof item).toBe('string');
    }
  });
});
