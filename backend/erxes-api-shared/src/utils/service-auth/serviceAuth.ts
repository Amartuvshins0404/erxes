import { createHash, createHmac, hkdfSync, timingSafeEqual } from 'crypto';

export const SERVICE_AUTH_HEADER = 'x-erxes-service-auth';

export const SERVICE_AUTH_WINDOW_SECONDS = 300;

const SERVICE_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

const serviceTokenKey = (masterKey: string): Buffer =>
  Buffer.from(
    hkdfSync('sha256', masterKey, 'erxes-services', 'service-token-v1', 32),
  );

export const deriveServiceToken = (
  masterKey: string,
  serviceName: string,
): string =>
  createHmac('sha256', serviceTokenKey(masterKey))
    .update(`service:${serviceName}`)
    .digest('base64url');

interface IServiceRequestParts {
  subdomain: string;
  path: string;
  body: string;
}

const computeSignature = (
  token: string,
  serviceName: string,
  timestamp: number,
  { subdomain, path, body }: IServiceRequestParts,
): string =>
  createHmac('sha256', token)
    .update(
      `v1\n${serviceName}\n${timestamp}\n${subdomain}\n${path}\n${createHash(
        'sha256',
      )
        .update(body)
        .digest('hex')}`,
    )
    .digest('base64url');

export const signServiceRequest = ({
  serviceName,
  token,
  subdomain,
  path,
  body,
  now = Date.now(),
}: IServiceRequestParts & {
  serviceName: string;
  token: string;
  now?: number;
}): string => {
  if (!SERVICE_NAME_PATTERN.test(serviceName)) {
    throw new Error('Invalid service name');
  }

  const timestamp = Math.floor(now / 1000);

  return [
    'v1',
    serviceName,
    timestamp,
    computeSignature(token, serviceName, timestamp, { subdomain, path, body }),
  ].join('.');
};

export const verifyServiceRequest = ({
  header,
  masterKey,
  subdomain,
  path,
  body,
  now = Date.now(),
}: IServiceRequestParts & {
  header: string | undefined;
  masterKey: string | undefined;
  now?: number;
}): { serviceName: string } | null => {
  if (!header || !masterKey) {
    return null;
  }

  const parts = header.split('.');

  if (parts.length !== 4 || parts[0] !== 'v1') {
    return null;
  }

  const [, serviceName, rawTimestamp, signature] = parts;

  if (
    !SERVICE_NAME_PATTERN.test(serviceName) ||
    !/^\d{1,12}$/.test(rawTimestamp)
  ) {
    return null;
  }

  const timestamp = Number(rawTimestamp);

  if (
    Math.abs(Math.floor(now / 1000) - timestamp) > SERVICE_AUTH_WINDOW_SECONDS
  ) {
    return null;
  }

  const expected = Buffer.from(
    computeSignature(
      deriveServiceToken(masterKey, serviceName),
      serviceName,
      timestamp,
      {
        subdomain,
        path,
        body,
      },
    ),
  );
  const received = Buffer.from(signature);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  return { serviceName };
};
