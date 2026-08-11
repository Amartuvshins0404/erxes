import crypto from 'crypto';
import { Resolver } from 'erxes-api-shared/core-types';
import fetch from 'node-fetch';

const { BLOCK_ADMIN_API_URL, BLOCK_ADMIN_SECRET } = process.env;

interface IData {
  [key: string]: any;
}

interface IPayload {
  data: IData;
  entityId?: string;
  entities?: IData;
}

interface SendMessagePayload {
  subdomain: string;
  path: string;
  payload: IPayload;
}

const buildPayload = (
  entity: any,
  args: any,
  options: { fields?: string[] } = {},
) => {
  const payload: IPayload = {
    data: args,
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

const sendMessage = ({ subdomain, path, payload }: SendMessagePayload) => {
  const API_ENDPOINT = `${BLOCK_ADMIN_API_URL}/webhook/${path}`;

  if (!BLOCK_ADMIN_API_URL || !BLOCK_ADMIN_SECRET) {
    return console.error('BLOCK_ADMIN_API_URL or BLOCK_ADMIN_SECRET is not set');
  }

  try {
    const body = JSON.stringify({ subdomain, payload });

    const signature = crypto
      .createHmac('sha256', BLOCK_ADMIN_SECRET)
      .update(body)
      .digest('hex');
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': `sha256=${signature}`,
      },
      body,
    });
  } catch (e) {
    console.error(`Failed to send message to block-admin: ${e}`);
  }
};

export const wrapMutationResolver = (mutations: Record<string, Resolver>) => {
  for (const [path, resolver] of Object.entries(mutations)) {
    mutations[path] = async (root, args, context, info) => {
      const entity = await resolver(root, args, context, info);

      if (entity) {
        sendMessage({
          subdomain: context.subdomain,
          path,
          payload: buildPayload(
            entity?.response || entity,
            args,
            entity.options,
          ),
        });
      }

      return entity?.response || entity;
    };
  }

  return mutations;
};
