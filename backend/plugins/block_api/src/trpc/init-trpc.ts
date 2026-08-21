import { projectTrpcRouter } from '@/project/trpc/project';
import { unitTrpcRouter } from '@/unit/trpc/unit';
import { initTRPC } from '@trpc/server';
import { ITRPCContext } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';

type BlockTRPCContext = ITRPCContext<{ models: IModels }>;

const t = initTRPC.context<BlockTRPCContext>().create();

export const appRouter = t.mergeRouters(
  unitTrpcRouter,
  projectTrpcRouter,
  t.router({
    developer: {
      getInfo: t.procedure.query(async ({ ctx }) => {
        const developer = await ctx.models.Developer.findOne({})
          .select('name')
          .lean();
        return developer ? { name: developer.name } : null;
      }),
    },
  }),
);

export type AppRouter = typeof appRouter;
