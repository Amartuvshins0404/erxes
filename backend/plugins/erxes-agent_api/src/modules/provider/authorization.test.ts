class ExpectedError extends Error {}

jest.mock('erxes-api-shared/utils', () => ({ ExpectedError }));

const requireActionScope = jest.fn();
jest.mock('@/_shared/authorization', () => ({
  requireActionScope: (...args: unknown[]) => requireActionScope(...args),
}));

import type { IUserDocument } from 'erxes-api-shared/core-types';
import { resolveProviderOwner } from './authorization';

const user = { _id: 'user-1' } as IUserDocument;

describe('provider ownership authorization', () => {
  beforeEach(() => requireActionScope.mockReset());

  it('forces own-scoped users into their personal provider namespace', async () => {
    requireActionScope.mockResolvedValue('own');

    await expect(
      resolveProviderOwner({
        subdomain: 'os',
        user,
        action: 'erxesAgentProvidersManage',
        requestedScope: 'organization',
      }),
    ).rejects.toThrow('Provider not found');

    await expect(
      resolveProviderOwner({
        subdomain: 'os',
        user,
        action: 'erxesAgentProvidersManage',
        requestedScope: 'personal',
      }),
    ).resolves.toEqual({ scope: 'personal', ownerId: user._id });
  });

  it('allows all-scoped Agent Admins to select either namespace', async () => {
    requireActionScope.mockResolvedValue('all');

    await expect(
      resolveProviderOwner({
        subdomain: 'os',
        user,
        action: 'erxesAgentProvidersManage',
        requestedScope: 'organization',
      }),
    ).resolves.toEqual({ scope: 'organization', ownerId: null });
    await expect(
      resolveProviderOwner({
        subdomain: 'os',
        user,
        action: 'erxesAgentProvidersManage',
        requestedScope: 'personal',
      }),
    ).resolves.toEqual({ scope: 'personal', ownerId: user._id });
  });
});
