// config.ts only imports `CoreTRPCContext` (a type) from ~/init-trpc and
// getFileUploadConfigs from the settings utils; stub both so their heavy runtime
// import graphs never load under isolatedModules.
jest.mock('~/init-trpc', () => ({}));
jest.mock('@/organization/settings/utils/configs', () => ({
  getFileUploadConfigs: jest.fn(),
}));

import { configTrpcRouter } from '../config';

const makeCtx = (distinct: jest.Mock) =>
  ({
    subdomain: 'test',
    models: { Configs: { find: jest.fn(() => ({ distinct })) } },
  }) as any;

describe('configs.getCodes', () => {
  it('returns config codes only (names, never values) via distinct("code")', async () => {
    const distinct = jest
      .fn()
      .mockResolvedValue([
        'CLOUDFLARE_API_TOKEN',
        'MAIL_HOST',
        'AWS_SECRET_ACCESS_KEY',
      ]);
    const ctx = makeCtx(distinct);
    const caller = configTrpcRouter.createCaller(ctx);

    const res = await caller.configs.getCodes();

    // Reads only the `code` field — no value is ever loaded or returned.
    expect(ctx.models.Configs.find).toHaveBeenCalledTimes(1);
    expect(distinct).toHaveBeenCalledWith('code');
    expect(res).toEqual([
      'CLOUDFLARE_API_TOKEN',
      'MAIL_HOST',
      'AWS_SECRET_ACCESS_KEY',
    ]);
  });

  it('returns an empty list when no configs are set', async () => {
    const distinct = jest.fn().mockResolvedValue([]);
    const caller = configTrpcRouter.createCaller(makeCtx(distinct));

    await expect(caller.configs.getCodes()).resolves.toEqual([]);
  });
});
