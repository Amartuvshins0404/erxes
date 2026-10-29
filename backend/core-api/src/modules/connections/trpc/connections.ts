import { TRPCError, initTRPC } from '@trpc/server';
import {
  ExpectedError,
  serializeServiceAuthBody,
  verifyServiceRequest,
} from 'erxes-api-shared/utils';
import { z } from 'zod';
import type { CoreTRPCContext } from '~/init-trpc';

const t = initTRPC.context<CoreTRPCContext>().create();

const serviceProcedure = t.procedure.use(
  async ({ ctx, path, getRawInput, next }) => {
    const caller = verifyServiceRequest({
      header: ctx.serviceAuthHeader,
      masterKey: process.env.ERXES_MASTER_KEY,
      subdomain: ctx.subdomain,
      path,
      body: serializeServiceAuthBody(await getRawInput()),
    });

    if (!caller) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid service authentication',
      });
    }

    return next({ ctx: { ...ctx, serviceName: caller.serviceName } });
  },
);

export const connectionsTrpcRouter = t.router({
  connections: t.router({
    resolve: serviceProcedure
      .input(z.object({ _id: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        try {
          return await ctx.models.Connections.resolveForService(
            input._id,
            ctx.serviceName,
          );
        } catch (error) {
          if (error instanceof ExpectedError) {
            throw new TRPCError({
              code:
                error.code === 'NOT_FOUND'
                  ? 'NOT_FOUND'
                  : 'INTERNAL_SERVER_ERROR',
              message: error.message,
            });
          }

          throw error;
        }
      }),
  }),
});
