import crypto from 'crypto';
import { Resolver } from 'erxes-api-shared/core-types';
import { getEnv, getSaasOrganizationDetail } from 'erxes-api-shared/utils';

export type ConsumerPlatform = 'mushop' | 'blockadmin';

interface IData {
  [key: string]: any;
}

interface IPayload {
  data?: IData;
  entityId?: string;
  entityIds?: string[];
  entities?: IData;
  order?: IData;
  status?: string;
}

interface SendMessagePayload {
  subdomain: string;
  path: string;
  payload: IPayload;
  platform?: ConsumerPlatform;
}

interface ConsumerConfig {
  name: ConsumerPlatform;
  url: string;
  secret: string;
  bundleEnv: string;
}

const getConsumers = (): ConsumerConfig[] => {
  const consumers: ConsumerConfig[] = [];

  if (
    process.env.MUSHOP_API_URL &&
    (process.env.MUSHOP_SECRET || process.env.MUSHOP_PUBLIC_API_KEY)
  ) {
    consumers.push({
      name: 'mushop',
      url: process.env.MUSHOP_API_URL,
      secret: (process.env.MUSHOP_SECRET || process.env.MUSHOP_PUBLIC_API_KEY)!,
      bundleEnv: 'MUSHOP_SUPPLIER_BUNDLE_TYPE',
    });
  }

  if (process.env.BLOCKADMIN_API_URL && process.env.BLOCK_ADMIN_SECRET) {
    consumers.push({
      name: 'blockadmin',
      url: process.env.BLOCKADMIN_API_URL,
      secret: process.env.BLOCK_ADMIN_SECRET,
      bundleEnv: 'BLOCKADMIN_SUPPLIER_BUNDLE_TYPE',
    });
  }

  return consumers;
};

const sendToConsumer = async (
  consumer: ConsumerConfig,
  subdomain: string,
  path: string,
  payload: IPayload,
): Promise<void> => {
  const endpoint = `${consumer.url}/webhook/${path}`;

  try {
    const body = JSON.stringify({ subdomain, payload });
    const signature = crypto
      .createHmac('sha256', consumer.secret)
      .update(body)
      .digest('hex');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': `sha256=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error(
        `Failed to send message to ${consumer.name}: HTTP ${res.status}`,
      );
    }
  } catch (e) {
    console.error(`Failed to send message to ${consumer.name}: ${e}`);
  }
};

const getBundleTargets = async (
  subdomain: string,
  consumers: ConsumerConfig[],
): Promise<ConsumerConfig[]> => {
  const organization = (await getSaasOrganizationDetail({ subdomain })) as
    | { bundle?: { type?: string } }
    | undefined;

  const bundleType = organization?.bundle?.type;
  if (!bundleType) return [];

  return consumers.filter((c) => getEnv({ name: c.bundleEnv }) === bundleType);
};

export const getTargetPlatform = async (
  subdomain: string,
): Promise<ConsumerPlatform | null> => {
  const targets = await getBundleTargets(subdomain, getConsumers());
  return targets[0]?.name ?? null;
};

export const sendMessage = async ({
  subdomain,
  path,
  payload,
  platform,
}: SendMessagePayload): Promise<void> => {
  const consumers = getConsumers();

  if (!consumers.length) {
    console.error(
      'No consumers configured (MUSHOP_API_URL / BLOCKADMIN_API_URL)',
    );
    return;
  }

  const targets = platform
    ? consumers.filter((c) => c.name === platform)
    : await getBundleTargets(subdomain, consumers);

  await Promise.all(
    targets.map((consumer) =>
      sendToConsumer(consumer, subdomain, path, payload),
    ),
  );
};

interface RequestMessagePayload {
  subdomain: string;
  path: string;
  payload: IPayload;
  platform: ConsumerPlatform;
}

export const requestMessage = async <T = any>({
  subdomain,
  path,
  payload,
  platform,
}: RequestMessagePayload): Promise<T | null> => {
  const consumer = getConsumers().find((c) => c.name === platform);

  if (!consumer) {
    console.error(`No consumer configured for ${platform}`);
    return null;
  }

  const endpoint = `${consumer.url}/webhook/${path}`;
  const body = JSON.stringify({ subdomain, payload });
  const signature = crypto
    .createHmac('sha256', consumer.secret)
    .update(body)
    .digest('hex');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': `sha256=${signature}`,
    },
    body,
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`${platform} ${path} HTTP ${res.status}`);
  }

  return (await res.json()) as T;
};

const buildPayload = (
  entity: any,
  args: any,
  context: any,
  options: { fields?: string[] },
) => {
  const payload: IPayload = {
    data: {
      ...args,
      userId: context?.user?._id,
    },
  };

  if (Array.isArray(entity)) {
    payload.entities = entity;

    if (options.fields) {
      const entities = {};

      for (const item of entity) {
        entities[item._id] = {};

        for (const field of options.fields) {
          entities[item._id][field] = item[field];
        }
      }

      payload.entities = entities;
    }
  }

  if (typeof entity === 'object') {
    payload.entityId = entity._id;
  }

  return payload;
};

export const wrapMutationResolver = (mutations: Record<string, Resolver>) => {
  for (const [path, resolver] of Object.entries(mutations)) {
    mutations[path] = async (root, args, context, info) => {
      const entity = await resolver(root, args, context, info);

      if (entity) {
        await sendMessage({
          subdomain: context.subdomain,
          path,
          payload: buildPayload(
            entity?.response || entity,
            args,
            context,
            entity.options,
          ),
        });
      }

      return entity?.response || entity;
    };
  }

  return mutations;
};
