import { initTRPC } from '@trpc/server';
import { ITRPCContext } from 'erxes-api-shared/utils';
import { z } from 'zod';

import { IModels } from '~/connectionResolvers';
import { agentMeta } from '~/trpc/agentMeta';

export type OroltsooTRPCContext = ITRPCContext<{ models: IModels }>;

const t = initTRPC.context<OroltsooTRPCContext>().create();

export const profileTrpcRouter = t.router({
  oroltsooProfile: {
    get: t.procedure
      .meta(
        agentMeta(
          "Get this workspace's politician profile: name, position, party, district, mandate, biography, promises, bills, attendance, finance disclosures and contact details. There is exactly one profile, so this takes no arguments.",
          { module: 'oroltsooProfile', action: 'showOroltsooProfiles' },
        ),
      )
      .input(z.object({}).strict())
      .query(async ({ ctx }) => {
        return ctx.models.Profile.findOne({}).lean();
      }),
  },
});
