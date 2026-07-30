import { checkServiceRunning } from '../utils';
import { ILogDoc } from '../../core-types';
import { sendWorkerQueue } from '../mq-worker';
import { initializePluginConfig } from '../service-discovery';
import { Express } from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { initTRPC } from '@trpc/server';
import { createTRPCContext } from '../trpc';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { sanitizeLogTransportDocument } from './sanitize';

export * from './sanitize';

type LogPayloadExtension = Record<string, unknown> | null | undefined;

export const logHandler = async <T>(
  resolver: () => Promise<T> | T,
  logDoc: ILogDoc,
  onSuccess?: LogPayloadExtension,
  onError?: LogPayloadExtension,
  skipSaveResult?: boolean,
): Promise<T> => {
  if (!(await checkServiceRunning('logs'))) {
    return await resolver();
  }

  const payload = { ...(logDoc?.payload || {}) };
  const startDate = new Date();
  const startTime = performance.now();

  try {
    const result = await resolver();
    const endTime = performance.now();
    const logToPersist: ILogDoc = {
      ...logDoc,
      payload: { ...payload, ...(onSuccess || {}) },
      executionTime: {
        startDate,
        endDate: new Date(),
        durationMs: endTime - startTime,
      },
      status: 'success',
    };

    if (!skipSaveResult) {
      logToPersist.payload.result = result;
    }

    sendWorkerQueue('logs', 'put_log').add(
      'put_log',
      sanitizeLogTransportDocument(logToPersist),
      {
        removeOnComplete: true,
      },
    );

    return result;
  } catch (error) {
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack available',
      name: error.name || 'Error',
    };
    const logToPersist: ILogDoc = {
      ...logDoc,
      payload: { ...payload, ...(onError || {}), error: errorDetails },
      status: 'failed',
    };

    sendWorkerQueue('logs', 'put_log').add(
      'put_log',
      sanitizeLogTransportDocument(logToPersist),
      {
        removeOnComplete: true,
      },
    );

    throw error;
  }
};
type IContext = {
  subdomain: string;
  processId?: string;
};

type AfterMutation = {
  type: 'afterMutation';
  mutationNames: string[];
};

type UpdatedDocument = {
  type: 'updatedDocument';
  contentTypes: string[];
  when?: {
    fieldsUpdated?: string[];
    fieldsRemoved?: string[];
  };
};

type CreateDocument = {
  type: 'createdDocument';
  contentTypes: string[];
  when?: {
    fieldsWith?: string[];
  };
};

type AfterAPIRequest = {
  type: 'afterAPIRequest';
  paths: string[];
};

type AfterAuth = {
  type: 'afterAuth';
  types: string[];
};

export type IAfterProcessRule =
  | AfterMutation
  | CreateDocument
  | UpdatedDocument
  | AfterAPIRequest
  | AfterAuth;

export type TAfterProcessRule = {
  AfterMutation: AfterMutation;
  CreateDocument: CreateDocument;
  UpdatedDocument: UpdatedDocument;
  AfterAPIRequest: AfterAPIRequest;
  AfterAuth: AfterAuth;
};

export interface AfterProcessConfigs {
  rules: IAfterProcessRule[];
  afterMutation?: (
    context: IContext,
    args: {
      data: {
        mutationName: string;
        args: { [key: string]: any };
        result: any;
        userId?: string;
      };
    },
  ) => void | Promise<void>;
  afterAuth?: (
    context: IContext,
    args: { userId: string; email: string; result: string },
  ) => void;
  afterApiRequest?: (context: IContext, args: any) => void;
  afterDocumentUpdated?: <TDocument = any>(
    context: IContext,
    args: {
      data: {
        collectionName: string;
        docId: string;
        prevDocument?: any;
        currentDocument?: any;
        updateDescription: {
          added: { [key: string]: any };
          updated: { [key: string]: any };
          removed: string[];
        };
        userId: string;
        processId: string;
        contentType: string;
      };
    },
  ) => void;
  afterDocumentCreated?: <TDocument = any>(
    context: IContext,
    args: {
      data: {
        collectionName: string;
        docId: string;
        currentDocument?: any;
        userId: string;
        processId: string;
        contentType: string;
      };
    },
  ) => void;
}

export interface AfterProcessModuleConfig<TModels = any> {
  rules: IAfterProcessRule[];
  createdDocument?: Record<
    string,
    (models: TModels, data: any) => Promise<void>
  >;
  updatedDocument?: Record<
    string,
    (subdomain: string, models: TModels, data: any) => Promise<void>
  >;
  afterMutation?: Record<
    string,
    (subdomain: string, models: TModels, data: any) => Promise<void>
  >;
}

export interface AfterProcessModules<TModels = any> {
  [moduleName: string]: AfterProcessModuleConfig<TModels>;
}

export const startAfterProcess = async (
  app: Express,
  pluginName: string,
  config: AfterProcessConfigs,
) => {
  await initializePluginConfig(pluginName, 'afterProcess', config);

  const t = initTRPC.context<IContext>().create();

  const {
    afterMutation,
    afterAuth,
    afterApiRequest,
    afterDocumentUpdated,
    afterDocumentCreated,
  } = config || {};

  const routes: Record<string, any> = {};

  if (afterMutation) {
    routes.afterMutation = t.procedure
      .input(z.any())
      .mutation(async ({ ctx, input }) => afterMutation(ctx, input));
  }

  if (afterAuth) {
    routes.afterAuth = t.procedure
      .input(z.any())
      .mutation(async ({ ctx, input }) => afterAuth(ctx, input));
  }

  if (afterApiRequest) {
    routes.afterApiRequest = t.procedure
      .input(z.any())
      .mutation(async ({ ctx, input }) => afterApiRequest(ctx, input));
  }

  if (afterDocumentUpdated) {
    routes.afterDocumentUpdated = t.procedure
      .input(z.any())
      .mutation(async ({ ctx, input }) => afterDocumentUpdated(ctx, input));
  }

  if (afterDocumentCreated) {
    routes.afterDocumentCreated = t.procedure
      .input(z.any())
      .mutation(async ({ ctx, input }) => afterDocumentCreated(ctx, input));
  }

  const afterProcessRouter = t.router(routes);

  const trpcMiddleware = trpcExpress.createExpressMiddleware({
    router: afterProcessRouter,
    createContext: createTRPCContext(async (_subdomain, context) => {
      const processId = nanoid(12);
      context.processId = processId;
      return context;
    }),
  });

  app.use('/afterProcess', trpcMiddleware);
};
