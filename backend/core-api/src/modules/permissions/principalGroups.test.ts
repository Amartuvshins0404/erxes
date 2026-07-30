import type { IModels } from '~/connectionResolvers';
import { validatePrincipalGroups } from './principalGroups';

const buildModels = (
  groups: Array<{ _id: string; principalType?: 'human' | 'agent' }>,
) => {
  const lean = jest.fn().mockResolvedValue(groups);
  const select = jest.fn(() => ({ lean }));
  const find = jest.fn(() => ({ select }));

  return {
    models: {
      PermissionGroups: { find },
    } as unknown as IModels,
    find,
  };
};

describe('validatePrincipalGroups', () => {
  it('rejects agent grant profiles for human users', async () => {
    const { models } = buildModels([
      { _id: 'agent-profile', principalType: 'agent' },
    ]);

    await expect(
      validatePrincipalGroups(models, { role: 'user' }, ['agent-profile']),
    ).rejects.toThrow(/cannot be assigned to human users/i);
  });

  it('allows service users to receive only agent grant profiles', async () => {
    const { models } = buildModels([
      { _id: 'agent-profile', principalType: 'agent' },
    ]);

    await expect(
      validatePrincipalGroups(models, { role: 'system' }, ['agent-profile']),
    ).resolves.toBeUndefined();
  });

  it('rejects human and default groups for service users', async () => {
    const humanGroup = buildModels([
      { _id: 'human-profile', principalType: 'human' },
    ]);
    const defaultGroup = buildModels([]);

    await expect(
      validatePrincipalGroups(humanGroup.models, { role: 'system' }, [
        'human-profile',
      ]),
    ).rejects.toThrow(/only receive agent grant profiles/i);
    await expect(
      validatePrincipalGroups(defaultGroup.models, { role: 'system' }, [
        'erxes-agent:admin',
      ]),
    ).rejects.toThrow(/only receive agent grant profiles/i);
  });

  it('rejects unknown custom group ids before assignment', async () => {
    const { models } = buildModels([]);

    await expect(
      validatePrincipalGroups(models, { role: 'user' }, ['missing-group']),
    ).rejects.toThrow(/not found/i);
  });
});
