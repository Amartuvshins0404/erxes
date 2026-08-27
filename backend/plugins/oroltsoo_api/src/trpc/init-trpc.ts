import { initTRPC } from '@trpc/server';
import { ITRPCContext } from 'erxes-api-shared/utils';

import { profileTrpcRouter } from '@/profile/trpc/profile';
import { IModels } from '~/connectionResolvers';

type OroltsooTRPCContext = ITRPCContext<{ models: IModels }>;

const t = initTRPC.context<OroltsooTRPCContext>().create();

export const appRouter = t.mergeRouters(profileTrpcRouter);

export type AppRouter = typeof appRouter;
