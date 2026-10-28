import sift from 'sift';
import { IUserDocument } from 'erxes-api-shared/core-types';
import type { IModels } from '~/connectionResolvers';
import {
  getContainerAccessFilter,
  getPipelineAccessFilter,
  getPipelineDealFilter,
  keepHiddenEntityIds,
} from '../structureAccess';

const mockTree: Record<string, string> = {
  root: 'root/',
  sales: 'root/sales/',
  team: 'root/sales/team/',
  ops: 'root/ops/',
};

const mockMemberships: Record<string, { nodes: string[]; covers: string[] }> =
  {
    alice: { nodes: ['team'], covers: [] },
    bob: { nodes: ['ops'], covers: [] },
    carol: { nodes: ['sales'], covers: ['sales', 'team'] },
    dave: { nodes: ['team'], covers: [] },
  };

const mockUserContext = (userId: string) => {
  const { nodes = [], covers = [] } = mockMemberships[userId] || {};
  const boundaryEntityIds = [...new Set([...nodes, ...covers])];

  return {
    primaryEntityId: nodes[0],
    entityIds: nodes,
    principalEntityIds: [
      ...new Set(
        nodes.flatMap((node) => mockTree[node].split('/').filter(Boolean)),
      ),
    ],
    boundaryEntityIds,
    boundaryUserIds: Object.keys(mockMemberships).filter((id) =>
      mockMemberships[id].nodes.some((node) =>
        boundaryEntityIds.includes(node),
      ),
    ),
  };
};

jest.mock('erxes-api-shared/core-modules/permissions/scope', () => ({
  PERMISSION_SCOPES: { SELF: 'self', ENTITY: 'entity' },
  getStructureUserContext: async (_subdomain: string, userId: string) =>
    mockUserContext(userId),
}));

jest.mock('erxes-api-shared/utils', () => ({
  ...jest.requireActual('erxes-api-shared/utils'),
  sendTRPCMessage: async ({
    module,
    action,
    input,
  }: {
    module: string;
    action: string;
    input: { userId: string };
  }) => {
    if (module === 'permissions' && action === 'resolveScope') {
      const context = mockUserContext(input.userId);

      return {
        all: input.userId === 'owner',
        userIds: context.boundaryUserIds,
        entityIds: context.boundaryEntityIds,
      };
    }

    return null;
  },
}));

const asUser = (_id: string) =>
  ({ _id, isOwner: _id === 'owner' }) as IUserDocument;

const visibleIds = async <T extends { _id: string }>(
  records: T[],
  filter: Promise<Record<string, unknown>>,
) => records.filter(sift(await filter)).map(({ _id }) => _id);

describe('sales container sharing', () => {
  const pipelines = [
    { _id: 'publicOpen', visibility: 'public', sharedEntityIds: [] },
    { _id: 'publicSales', visibility: 'public', sharedEntityIds: ['sales'] },
    { _id: 'privateSales', visibility: 'private', sharedEntityIds: ['sales'] },
    {
      _id: 'privateMembers',
      visibility: 'private',
      sharedEntityIds: [],
      memberIds: ['bob'],
    },
    {
      _id: 'privateOwnedByBob',
      visibility: 'private',
      sharedEntityIds: ['team'],
      userId: 'bob',
    },
  ];

  const pipelineAccess = (userId: string) =>
    visibleIds(
      pipelines,
      getContainerAccessFilter('tenant', asUser(userId), [
        'memberIds',
        'userId',
      ]),
    );

  it('lets a member of a node use pipelines shared with an ancestor', async () => {
    expect(await pipelineAccess('alice')).toEqual([
      'publicOpen',
      'publicSales',
      'privateSales',
      'privateOwnedByBob',
    ]);
  });

  it('hides shared pipelines from users outside the shared node', async () => {
    expect(await pipelineAccess('bob')).toEqual([
      'publicOpen',
      'privateMembers',
      'privateOwnedByBob',
    ]);
  });

  it('does not open a private pipeline to everyone below a node it is not shared with', async () => {
    expect(await pipelineAccess('carol')).not.toContain('privateOwnedByBob');
    expect(await pipelineAccess('carol')).not.toContain('privateMembers');
  });

  it('lets the owner use every pipeline', async () => {
    expect(await pipelineAccess('owner')).toEqual(
      pipelines.map(({ _id }) => _id),
    );
  });
});

describe('sales board sharing', () => {
  const boards = [
    { _id: 'openBoard', sharedEntityIds: [] },
    { _id: 'opsBoard', sharedEntityIds: ['ops'] },
    { _id: 'aliceBoard', sharedEntityIds: ['ops'], userId: 'alice' },
  ];

  const models = {
    Boards: {
      distinct: async (_field: string, filter: Record<string, unknown>) =>
        boards.filter(sift(filter)).map(({ _id }) => _id),
    },
  } as unknown as IModels;

  const pipelines = [
    { _id: 'inOpenBoard', boardId: 'openBoard', sharedEntityIds: ['sales'] },
    { _id: 'inOpsBoard', boardId: 'opsBoard', sharedEntityIds: ['sales'] },
    { _id: 'inAliceBoard', boardId: 'aliceBoard', sharedEntityIds: [] },
  ];

  const pipelineAccess = (userId: string) =>
    visibleIds(
      pipelines,
      getPipelineAccessFilter(models, 'tenant', asUser(userId)),
    );

  it('hides pipelines of a board that is not shared with the user', async () => {
    expect(await pipelineAccess('dave')).toEqual(['inOpenBoard']);
  });

  it('keeps pipelines of boards the user created or shares', async () => {
    expect(await pipelineAccess('alice')).toEqual([
      'inOpenBoard',
      'inAliceBoard',
    ]);
    expect(await pipelineAccess('bob')).toEqual(['inAliceBoard']);
  });
});

describe('sales pipeline deal access rule', () => {
  const deals = [
    { _id: 'aliceDeal', userId: 'alice', entityIds: ['team'] },
    { _id: 'assignedToAlice', userId: 'bob', assignedUserIds: ['alice'] },
    { _id: 'daveDeal', userId: 'dave', entityIds: [] },
    { _id: 'teamDeal', userId: 'external', entityIds: ['team'] },
    { _id: 'bobDeal', userId: 'bob', entityIds: ['ops'] },
  ];

  const dealAccess = (
    userId: string,
    accessRule?: { scope?: 'self' | 'entity'; exemptUserIds?: string[] },
  ) =>
    visibleIds(
      deals,
      getPipelineDealFilter('tenant', asUser(userId), { accessRule }),
    );

  it('shows only own and assigned deals under the self rule', async () => {
    expect(await dealAccess('alice', { scope: 'self' })).toEqual([
      'aliceDeal',
      'assignedToAlice',
    ]);
  });

  it('shows deals of the structure the user covers under the entity rule', async () => {
    expect(await dealAccess('carol', { scope: 'entity' })).toEqual([
      'aliceDeal',
      'assignedToAlice',
      'daveDeal',
      'teamDeal',
    ]);
  });

  it('keeps deals outside the covered structure hidden under the entity rule', async () => {
    expect(await dealAccess('bob', { scope: 'entity' })).toEqual([
      'assignedToAlice',
      'bobDeal',
    ]);
  });

  it('lets exempt users and pipelines without a rule show every deal', async () => {
    expect(
      await dealAccess('bob', { scope: 'self', exemptUserIds: ['bob'] }),
    ).toHaveLength(deals.length);
    expect(await dealAccess('alice')).toHaveLength(deals.length);
  });
});

describe('deal structure nodes on edit', () => {
  it('keeps nodes the editor cannot see', async () => {
    expect(
      await keepHiddenEntityIds('tenant', 'alice', ['ops', 'team'], ['sales']),
    ).toEqual(['sales', 'ops']);
  });

  it('applies the submitted nodes when the editor sees every node', async () => {
    expect(
      await keepHiddenEntityIds('tenant', 'owner', ['ops', 'team'], ['sales']),
    ).toEqual(['sales']);
  });
});
