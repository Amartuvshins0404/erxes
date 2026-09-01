import { Request, Response, NextFunction } from 'express';
import { isSlaveMode, getMtoInstanceId, getMtoSecret } from '~/constants/mode';
import { getMasterClient } from '~/utils/masterClient';
import { getSubdomain } from 'erxes-api-shared/utils';

/**
 * Operations that are proxied to master in slave mode (reads + shared writes).
 */
const PROXY_TO_MASTER_OPERATIONS = [
  'mtoProfiles',
  'mtoProfilesCount',
  'mtoProfile',
  'mtoMyProfile',
  'mtoProfileCreate',
  'mtoProfileUpdate',
  'mtoProfilesRemove',
];

/** Operations that must never run locally in slave mode; these return 403. */
const BLOCKED_IN_SLAVE = ['mtoSystemConfigUpdateSelectedPayments'];

const isOperationInList = (
  query: string,
  operationName: string | undefined,
  list: string[],
): boolean => {
  if (operationName && list.includes(operationName)) {
    return true;
  }
  for (const op of list) {
    const regex = new RegExp(`\\b${op}\\b`, 'i');
    if (regex.test(query)) {
      return true;
    }
  }
  return false;
};

/**
 * Middleware that intercepts GraphQL requests in slave mode.
 * Blocked operations return 403. Whitelisted operations are proxied to master.
 * All other operations (config, introspection, etc.) run locally.
 */
export const graphqlProxyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.path !== '/graphql' || req.method !== 'POST') {
    return next();
  }

  if (!isSlaveMode()) {
    return next();
  }

  try {
    const { query, variables, operationName } = req.body;

    if (!query) {
      return next();
    }

    if (isOperationInList(query, operationName, BLOCKED_IN_SLAVE)) {
      return res.json({
        data: null,
        errors: [
          {
            message: 'OPERATION_NOT_ALLOWED_IN_SLAVE_MODE',
            extensions: { code: 'FORBIDDEN' },
          },
        ],
      });
    }

    if (!isOperationInList(query, operationName, PROXY_TO_MASTER_OPERATIONS)) {
      return next();
    }

    const subdomain = getSubdomain(req);
    const instanceId = await getMtoInstanceId(subdomain);

    if (!instanceId) {
      return res.status(503).json({
        data: null,
        errors: [
          {
            message: 'SLAVE_MODE_INSTANCE_ID_REQUIRED',
            extensions: { code: 'SERVICE_UNAVAILABLE' },
          },
        ],
      });
    }

    const masterClient = getMasterClient();

    const headers: Record<string, string> = {};

    if (req.headers.authorization) {
      headers.authorization = req.headers.authorization as string;
    }
    if (req.headers['x-subdomain']) {
      headers['x-subdomain'] = req.headers['x-subdomain'] as string;
    } else if (subdomain) {
      headers['x-subdomain'] = subdomain;
    }

    const cookies: string[] = [];

    const mtoSecret = getMtoSecret();
    if (mtoSecret) {
      cookies.push(`auth-token=${mtoSecret}`);
    }

    if (cookies.length > 0) {
      headers.cookie = cookies.join('; ');
    }

    if (instanceId) {
      headers['x-onefit-instance-id'] = instanceId;
    }

    if (req.headers['content-type']) {
      headers['content-type'] = req.headers['content-type'] as string;
    }

    const result = await masterClient.request(
      {
        query,
        variables: variables || {},
        operationName,
      },
      headers,
    );

    const { data, errors } = result;
    if (errors?.some((error: any) => error.message === 'Login required')) {
      return res.json({
        ...data,
        errors: [
          {
            message: 'INVALID MTO AUTHENTICATION',
          },
        ],
      });
    }
    return res.json(result);
  } catch (error: any) {
    return res.status(503).json({
      data: null,
      errors: [
        {
          message: 'SLAVE_MODE_MASTER_UNAVAILABLE',
          extensions: { code: 'SERVICE_UNAVAILABLE' },
        },
      ],
    });
  }
};
