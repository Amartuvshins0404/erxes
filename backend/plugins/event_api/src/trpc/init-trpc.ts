import { initTRPC } from '@trpc/server';
import { ITRPCContext } from 'erxes-api-shared/utils';
import { z } from 'zod';
import { IModels } from '~/connectionResolvers';
import { EventStatus } from '@/event/constants';

export type EventTRPCContext = ITRPCContext<{ models: IModels }>;

const t = initTRPC.context<EventTRPCContext>().create();

const stringQueryCondition = z.union([
  z.string(),
  z
    .object({
      $in: z.array(z.string()).optional(),
      $nin: z.array(z.string()).optional(),
      $ne: z.string().optional(),
    })
    .strict(),
]);

const eventFindQuerySchema = z
  .object({
    _id: stringQueryCondition.optional(),
    ownerId: stringQueryCondition.optional(),
    status: stringQueryCondition.optional(),
    tagIds: stringQueryCondition.optional(),
  })
  .strict();

export const appRouter = t.router({
  event: t.router({
    find: t.procedure
      .input(z.object({ query: eventFindQuerySchema.optional() }))
      .query(async ({ ctx, input }) => {
        const { models } = ctx;

        return models.Events.find(input.query || {}).lean();
      }),
    findPublished: t.procedure
      .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
      .query(async ({ ctx, input }) => {
        const { models } = ctx;

        return models.Events.find({ status: EventStatus.PUBLISHED })
          .sort({ startDate: 1 })
          .limit(input.limit)
          .lean();
      }),
  }),
});

export type AppRouter = typeof appRouter;
