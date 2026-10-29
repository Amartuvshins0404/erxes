import { ExpectedError } from 'erxes-api-shared/utils';
import type { IContext } from '~/connectionResolvers';
import {
  listUsableConnections,
  pickUsableConnection,
} from '@/agents/connectionAccess';
import { probeProviderModel } from '@/agents/modelProbe';
import { toResolvedConnection } from '@/connections/access';

const connectionNotUsable = () =>
  new ExpectedError(
    'This connection is not available. Pick another one in Settings → Connections.',
    'VALIDATION_ERROR',
  );

export const agentsModelMutations = {
  agentsModelVerify: async (
    _p: undefined,
    args: { connectionId: string; model: string },
    ctx: IContext,
  ) => {
    await ctx.checkPermission('agentsChat');

    const usable = await listUsableConnections(ctx.models, ctx.user._id);
    const connection = pickUsableConnection(usable, {
      requestedId: args.connectionId,
    });

    if (!connection) {
      throw connectionNotUsable();
    }

    const { resolved, unreadable } = toResolvedConnection(connection);
    const model = (args.model || '').trim();

    if (unreadable.length) {
      return {
        provider: resolved.type,
        model,
        ok: false,
        error:
          'The saved secrets cannot be decrypted. Re-enter them in Settings → Connections.',
      };
    }

    return {
      provider: resolved.type,
      model,
      ...(await probeProviderModel({ connection: resolved, model })),
    };
  },

  agentsSetDefaultConnection: async (
    _p: undefined,
    args: { connectionId?: string | null },
    ctx: IContext,
  ) => {
    await ctx.checkPermission('agentsChat');

    const connectionId = (args.connectionId || '').trim();

    if (!connectionId) {
      await ctx.models.AgentsUserPreferences.updateOne(
        { userId: ctx.user._id },
        { $unset: { defaultConnectionId: '' } },
      );

      return true;
    }

    const usable = await listUsableConnections(ctx.models, ctx.user._id);

    if (!pickUsableConnection(usable, { requestedId: connectionId })) {
      throw connectionNotUsable();
    }

    await ctx.models.AgentsUserPreferences.updateOne(
      { userId: ctx.user._id },
      { $set: { defaultConnectionId: connectionId } },
      { upsert: true },
    );

    return true;
  },
};
