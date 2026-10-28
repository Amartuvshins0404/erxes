import type { IContext } from '~/connectionResolvers';
import { CMS_POST_ACTIONS, permissions } from '~/meta/permissions';
import {
  assertCmsDocumentAccess,
  getCmsScopeQuery,
  requireCmsPermission,
} from '../permissions';

type Seat = {
  userId: string;
  groupId: string;
  entityId: string;
  inherit: boolean;
};

type ResolveScopeInput = {
  userId: string;
  plugin: string;
  module: string;
  actions: string[];
};

const ROOT = 'organization';
const DESK = 'sportsDesk';

const members: Record<string, string[]> = {
  [ROOT]: ['chiefEditor', 'deskEditor', 'reporter', 'outsider'],
  [DESK]: ['deskEditor', 'reporter'],
};

let seats: Seat[] = [];

const groupPermissions = (groupId: string) =>
  permissions.defaultGroups?.find((group) => group.id === groupId)
    ?.permissions || [];

const effectiveGrants = (userId: string) =>
  seats
    .filter((seat) => seat.userId === userId)
    .map((seat) => ({
      permissions: groupPermissions(seat.groupId),
      entityId: seat.entityId,
      inherit: seat.inherit,
    }));

const actionsMap = (userId: string): Record<string, boolean> =>
  Object.fromEntries(
    effectiveGrants(userId)
      .flatMap((grant) => grant.permissions)
      .flatMap((permission) => permission.actions || [])
      .map((action) => [action, true]),
  );

const resolveScope = ({
  userId,
  plugin,
  module,
  actions,
}: ResolveScopeInput) => {
  const matching = effectiveGrants(userId).filter((grant) =>
    grant.permissions.some(
      (permission) =>
        permission.plugin === plugin &&
        permission.module === module &&
        (permission.actions || []).some((action) => actions.includes(action)),
    ),
  );

  if (matching.some((grant) => grant.entityId === ROOT && grant.inherit)) {
    return { all: true, userIds: [], entityIds: [] };
  }

  const entityIds = matching.map((grant) => grant.entityId);

  return {
    all: false,
    userIds: [
      ...new Set([userId, ...entityIds.flatMap((id) => members[id] || [])]),
    ],
    entityIds,
  };
};

jest.mock('erxes-api-shared/core-modules', () => ({
  canGroup: jest.fn(
    async (_subdomain: string, action: string, user?: IContext['user']) =>
      Boolean(user?.isOwner) || actionsMap(user?._id || '')[action] === true,
  ),
  getGroupActionsMap: jest.fn(
    async (_subdomain: string, user: IContext['user']) => actionsMap(user._id),
  ),
}));

jest.mock('erxes-api-shared/utils', () => ({
  sendTRPCMessage: jest.fn(
    async ({
      module,
      action,
      input,
      defaultValue,
    }: {
      module: string;
      action: string;
      input: ResolveScopeInput;
      defaultValue: unknown;
    }) =>
      module === 'permissions' && action === 'resolveScope'
        ? resolveScope(input)
        : defaultValue,
  ),
}));

const contextFor = (userId: string, isOwner = false) =>
  ({
    subdomain: 'tenantA',
    user: { _id: userId, isActive: true, isOwner },
    models: {},
  } as unknown as Parameters<typeof requireCmsPermission>[0]);

const seat = (
  userId: string,
  groupId: string,
  entityId = ROOT,
  inherit = true,
): Seat => ({ userId, groupId, entityId, inherit });

beforeEach(() => {
  seats = [];
});

describe('CMS permissions resolved from structure seats', () => {
  test('an organization-wide editor seat grants editing and approving every post', async () => {
    seats = [seat('chiefEditor', 'content:cms-editor')];
    const context = contextFor('chiefEditor');

    await expect(
      requireCmsPermission(context, CMS_POST_ACTIONS.approve),
    ).resolves.toMatchObject({ all: true });
    await expect(
      getCmsScopeQuery(context, CMS_POST_ACTIONS.update),
    ).resolves.toEqual({});
    await expect(
      assertCmsDocumentAccess({
        context,
        actions: CMS_POST_ACTIONS.update,
        document: { authorId: 'outsider' },
      }),
    ).resolves.toBeUndefined();
  });

  test('a member without a seat cannot read or edit posts', async () => {
    const context = contextFor('outsider');

    await expect(
      requireCmsPermission(context, CMS_POST_ACTIONS.read),
    ).rejects.toThrow('Permission required');
    await expect(
      getCmsScopeQuery(context, CMS_POST_ACTIONS.read),
    ).rejects.toThrow('Permission required');
    await expect(
      assertCmsDocumentAccess({
        context,
        actions: CMS_POST_ACTIONS.update,
        document: { authorId: 'outsider' },
      }),
    ).rejects.toThrow('Permission required');
  });

  test('a seat only grants the actions of its position groups', async () => {
    seats = [seat('reporter', 'content:cms-journalist-2')];
    const context = contextFor('reporter');

    await expect(
      requireCmsPermission(context, CMS_POST_ACTIONS.createReview),
    ).resolves.toMatchObject({ all: true });
    await expect(
      requireCmsPermission(context, [
        CMS_POST_ACTIONS.approve,
        CMS_POST_ACTIONS.createPublished,
      ]),
    ).rejects.toThrow('Permission required');
    await expect(
      requireCmsPermission(context, CMS_POST_ACTIONS.remove),
    ).rejects.toThrow('Permission required');
  });

  test('a desk seat limits editing to posts authored by desk members', async () => {
    seats = [seat('deskEditor', 'content:cms-editor', DESK)];
    const context = contextFor('deskEditor');

    await expect(
      getCmsScopeQuery(context, CMS_POST_ACTIONS.read),
    ).resolves.toEqual({
      authorId: { $in: ['deskEditor', 'reporter'] },
    });
    await expect(
      assertCmsDocumentAccess({
        context,
        actions: CMS_POST_ACTIONS.update,
        document: { authorId: 'reporter' },
      }),
    ).resolves.toBeUndefined();
    await expect(
      assertCmsDocumentAccess({
        context,
        actions: CMS_POST_ACTIONS.update,
        document: { authorId: 'outsider' },
      }),
    ).rejects.toThrow('Permission required');
  });

  test('the owner bypasses seats', async () => {
    const context = contextFor('founder', true);

    await expect(
      requireCmsPermission(context, CMS_POST_ACTIONS.remove),
    ).resolves.toMatchObject({ all: true });
    await expect(
      getCmsScopeQuery(context, CMS_POST_ACTIONS.read),
    ).resolves.toEqual({});
    await expect(
      assertCmsDocumentAccess({
        context,
        actions: CMS_POST_ACTIONS.remove,
        document: { authorId: 'outsider' },
      }),
    ).resolves.toBeUndefined();
  });
});

describe('Postiz sharing through default CMS groups held by seats', () => {
  test.each([
    'content:cms-journalist-1',
    'content:cms-journalist-2',
    'content:cms-editor',
    'content:cms-admin',
  ])('%s grants sharing', async (groupId) => {
    const group = permissions.defaultGroups?.find(
      (entry) => entry.id === groupId,
    );
    const cms = group?.permissions.find((entry) => entry.module === 'cmsPost');
    expect(
      cms?.actions?.filter((action) => action === CMS_POST_ACTIONS.sharePostiz),
    ).toHaveLength(1);
    expect(cms?.scope).toBe('all');

    seats = [seat('memberA', groupId)];

    await expect(
      requireCmsPermission(contextFor('memberA'), CMS_POST_ACTIONS.sharePostiz),
    ).resolves.toMatchObject({ all: true });
  });

  test('Journalist 2 retains review-only publication access despite the sharing grant', async () => {
    seats = [seat('memberA', 'content:cms-journalist-2')];
    const context = contextFor('memberA');

    await expect(
      requireCmsPermission(context, [
        CMS_POST_ACTIONS.approve,
        CMS_POST_ACTIONS.createPublished,
      ]),
    ).rejects.toThrow('Permission required');
    await expect(
      requireCmsPermission(context, CMS_POST_ACTIONS.managePermissions),
    ).rejects.toThrow('Permission required');
  });

  test.each([
    'content:cms-journalist-1',
    'content:cms-editor',
    'content:cms-admin',
  ])('%s keeps its publication grant', async (groupId) => {
    seats = [seat('memberA', groupId)];

    await expect(
      requireCmsPermission(contextFor('memberA'), [
        CMS_POST_ACTIONS.approve,
        CMS_POST_ACTIONS.createPublished,
      ]),
    ).resolves.toMatchObject({ all: true });
  });

  test.each(['content:viewer', 'content:unknown'])(
    '%s receives no sharing permission',
    async (groupId) => {
      seats = [seat('memberA', groupId)];

      await expect(
        requireCmsPermission(
          contextFor('memberA'),
          CMS_POST_ACTIONS.sharePostiz,
        ),
      ).rejects.toThrow('Permission required');
    },
  );
});
