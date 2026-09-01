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

const unitFindInput = z
  .object({
    query: z.record(z.unknown()).optional(),
    skip: z.number().int().min(0).optional(),
    limit: z.number().int().min(1).optional(),
    sort: z.record(z.unknown()).optional(),
    fields: z.array(z.string()).optional(),
  })
  .strict();

const unitCountInput = z
  .object({
    filter: z.record(z.unknown()).optional(),
  })
  .strict();

export const unitTrpcRouter = t.router({
  unit: {
    findOne: t.procedure
      .meta(
        agentMeta(
          'Get a single real-estate unit by any MongoDB-style query, e.g. { _id } or { number: "101" }. Returns null when nothing matches. Call this before answering detailed questions about one unit.',
          { module: 'unit', action: 'showUnits' },
        ),
      )
      .input(z.any())
      .query(async ({ ctx, input }) => {
        const { models } = ctx;
        return await models.Unit.findOne(input).lean();
      }),

    find: t.procedure
      .meta(
        agentMeta(
          "Search real-estate units: { query: {...}, skip?, limit?, sort?, fields? }, e.g. sellable units with { query: { status: 'available', locked: false } }. Only the listed fields are accepted. Results are always bounded: limit defaults to 20 and is capped at 100 — paginate with skip, and pass fields to project only the attributes you need. Use unit.count for 'how many units ...' questions.",
          { module: 'unit', action: 'showUnits' },
        ),
      )
      .input(unitFindInput)
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

        return await models.Unit.find(query, projection)
          .skip(skip)
          .limit(boundedLimit)
          // Sort directions arrive as plain JSON; mongoose validates the
          // values at query time (external-library boundary cast).
          .sort(sort as Record<string, SortOrder>)
          .lean();
      }),

    count: t.procedure
      .meta(
        agentMeta(
          "Count real-estate units matching a MongoDB-style filter: { filter: {...} }, e.g. sellable units with { filter: { status: 'available', locked: false } }; {} counts every unit. Use for 'how many units ...' questions instead of unit.find.",
          { module: 'unit', action: 'showUnits' },
        ),
      )
      .input(unitCountInput)
      .query(async ({ ctx, input }) => {
        const { models } = ctx;

        return await models.Unit.find(input.filter ?? {}).countDocuments();
      }),
  },
});
