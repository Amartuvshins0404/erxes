import { redis, startPlugin, getEnv } from 'erxes-api-shared/utils';
import resolvers from '~/apollo/resolvers';
import { typeDefs } from '~/apollo/typeDefs';
import { generateModels } from '~/connectionResolvers';
import { router } from '~/routes';
import {
  getMtoMode,
  getMtoInstanceId,
  getMtoSecret,
  getMtoMasterUrl,
  isSlaveMode,
} from '~/constants/mode';
import { getMasterClient } from '~/utils/masterClient';
import { graphqlProxyMiddleware } from '~/middlewares/graphqlProxyMiddleware';
import { initMQWorkers } from '~/worker';
import { handleRegistrationPaymentCallback } from '@/registration/utils/registrationPayment';

const DOMAIN = getEnv({ name: 'DOMAIN' });
const ALLOWED_ORIGINS = getEnv({ name: 'ALLOWED_ORIGINS' });

const corsOptions = {
  credentials: true,
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      DOMAIN,
      ...(ALLOWED_ORIGINS ? ALLOWED_ORIGINS.split(',') : []),
    ].filter(Boolean);

    // Allow if origin matches any allowed origin or is a subdomain pattern
    const isAllowed = allowedOrigins.some((allowed) => {
      if (typeof allowed === 'string') {
        return (
          origin === allowed ||
          origin.includes(
            allowed.replace('http://', '').replace('https://', ''),
          )
        );
      }
      return false;
    });

    // Allow all origins for now - can be tightened based on requirements
    callback(null, true);
  },
};

startPlugin({
  name: 'mto',
  port: 33015,
  corsOptions,
  graphql: async () => ({
    typeDefs: await typeDefs(),
    resolvers,
  }),
  expressRouter: router,
  middlewares: [graphqlProxyMiddleware],
  onServerInit: async () => {
    await initMQWorkers(redis);
  },
  apolloServerContext: async (subdomain, context, req, res) => {
    const models = await generateModels(subdomain);
    const mode = getMtoMode();
    if (mode === 'master') {
      // until app token is implemented
      redis.set(
        `user_token_s68ZFqvF1hm-FqufRFcFD_${getMtoSecret()}`,
        1,
        'EX',
        24 * 60 * 60,
      );
    }
    // Extract instanceId from header (when request comes from slave)
    const instanceIdFromHeader = req.headers['x-onefit-instance-id'] as
      | string
      | undefined;

    const VERSION = getEnv({ name: 'VERSION', defaultValue: 'os' });
    let instanceId: string | undefined;

    // Prefer instanceId from config when set (saved in OneFit settings)

    if (VERSION === 'saas') {
      instanceId = await getMtoInstanceId(subdomain);
    } else {
      instanceId = isSlaveMode()
        ? await getMtoInstanceId(subdomain)
        : instanceIdFromHeader;
    }

    const masterClient = isSlaveMode() ? getMasterClient() : undefined;
    const masterUrl = getMtoMasterUrl();

    context.models = models;
    context.mode = mode;
    context.instanceId = instanceId; // This will be set from header in master mode
    context.masterClient = masterClient;
    context.masterUrl = masterUrl;
    return context;
  },
  meta: {
    payments: {
      transactionCallback: async () => {
        // Registration payments are handled on invoice paid callback.
      },
      callback: async (subdomain, data) => {
        await handleRegistrationPaymentCallback(subdomain, data);
      },
    },
  },
});
