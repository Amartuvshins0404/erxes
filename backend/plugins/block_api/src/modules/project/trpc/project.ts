import { initTRPC } from '@trpc/server';
import { ITRPCContext } from 'erxes-api-shared/utils';
import type { SortOrder } from 'mongoose';
import { z } from 'zod';
import { IModels } from '~/connectionResolvers';
import { agentMeta } from '~/trpc/agentMeta';

export type BlockTRPCContext = ITRPCContext<{ models: IModels }>;

const t = initTRPC.context<BlockTRPCContext>().create();

// Agent-facing reads are ALWAYS bounded. An unbounded find serializes the
// whole collection and can exceed the 64KB agent-tools response budget
// (413 RESPONSE_TOO_LARGE) or stall the agent run. Defaults keep a full
// document page well inside the budget.
const AGENT_FIND_DEFAULT_LIMIT = 20;
const AGENT_FIND_MAX_LIMIT = 100;

const projectFindInput = z
  .object({
    query: z.record(z.unknown()).optional(),
    skip: z.number().int().min(0).optional(),
    limit: z.number().int().min(1).optional(),
    sort: z.record(z.unknown()).optional(),
    fields: z.array(z.string()).optional(),
  })
  .strict();

export const projectTrpcRouter = t.router({
  project: {
    findOne: t.procedure
      .meta(
        agentMeta(
          'Get a single real-estate project by any MongoDB-style query, e.g. { _id } or { name: "..." }. Returns null when nothing matches. Use for location, price range, amenities, and schedule questions about one project.',
          { module: 'project', action: 'showProjects' },
        ),
      )
      .input(z.any())
      .query(async ({ ctx, input }) => {
        const { models } = ctx;
        return await models.Project.findOne(input).lean();
      }),

    find: t.procedure
      .meta(
        agentMeta(
          'Search real-estate projects: { query: {...}, skip?, limit?, sort?, fields? }, e.g. published projects with { query: { isPublished: true } }. Only the listed fields are accepted. Results are always bounded: limit defaults to 20 and is capped at 100 — paginate with skip, and pass fields to project only the attributes you need.',
          { module: 'project', action: 'showProjects' },
        ),
      )
      .input(projectFindInput)
      .query(async ({ ctx, input }) => {
        const { models } = ctx;
        const { query = {}, skip = 0, limit, sort = {}, fields } = input;

        const boundedLimit = Math.min(
          limit ?? AGENT_FIND_DEFAULT_LIMIT,
          AGENT_FIND_MAX_LIMIT,
        );
        const projection = fields?.length
          ? Object.fromEntries(fields.map((field) => [field, 1]))
          : undefined;

        return await models.Project.find(query, projection)
          .skip(skip)
          .limit(boundedLimit)
          // Sort directions arrive as plain JSON; mongoose validates the
          // values at query time (external-library boundary cast).
          .sort(sort as Record<string, SortOrder>)
          .lean();
      }),
  },
});
