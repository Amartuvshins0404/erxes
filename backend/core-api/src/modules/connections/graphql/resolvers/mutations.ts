import { checkLogin } from 'erxes-api-shared/core-modules';
import { ExpectedError, markResolvers } from 'erxes-api-shared/utils';
import type { IContext } from '~/connectionResolvers';
import { assertCanManage, toResolvedConnection } from '@/connections/access';
import type {
  IConnectionAddInput,
  IConnectionEditInput,
} from '@/connections/@types/connection';
import { getConnectionType } from '@/connections/types';
import { toPublicConnection } from './queries';

export const connectionsMutations = {
  connectionsAdd: async (
    _parent: undefined,
    { input }: { input: IConnectionAddInput },
    ctx: IContext,
  ) => {
    checkLogin(ctx.user);

    if (input.scope !== 'personal') {
      await ctx.checkPermission('connectionsManage');
    }

    return toPublicConnection(
      await ctx.models.Connections.addConnection(input, ctx.user._id),
    );
  },

  connectionsEdit: async (
    _parent: undefined,
    { _id, input }: { _id: string; input: IConnectionEditInput },
    ctx: IContext,
  ) => {
    checkLogin(ctx.user);

    await assertCanManage(ctx, await ctx.models.Connections.getConnection(_id));

    return toPublicConnection(
      await ctx.models.Connections.editConnection(_id, input, ctx.user._id),
    );
  },

  connectionsRemove: async (
    _parent: undefined,
    { _id }: { _id: string },
    ctx: IContext,
  ) => {
    await assertCanManage(ctx, await ctx.models.Connections.getConnection(_id));
    await ctx.models.Connections.removeConnection(_id);

    return true;
  },

  connectionsTest: async (
    _parent: undefined,
    { _id }: { _id: string },
    ctx: IContext,
  ) => {
    const connection = await ctx.models.Connections.getForUser(
      _id,
      ctx.user._id,
    );

    if (!connection) {
      throw new ExpectedError('Connection not found', 'NOT_FOUND');
    }

    await assertCanManage(ctx, connection);

    const test = getConnectionType(connection.type)?.test;
    const { resolved, unreadable } = toResolvedConnection(connection);

    if (unreadable.length) {
      return {
        ok: false,
        error:
          'Saved secrets cannot be decrypted. Re-enter them and try again.',
      };
    }

    if (!test) {
      return { ok: true };
    }

    try {
      return await test(resolved);
    } catch {
      return { ok: false, error: 'The connection test failed.' };
    }
  },
};

markResolvers<IContext>(
  {
    connectionsAdd: connectionsMutations.connectionsAdd,
    connectionsEdit: connectionsMutations.connectionsEdit,
  },
  { wrapperConfig: { skipPermission: true } },
);
