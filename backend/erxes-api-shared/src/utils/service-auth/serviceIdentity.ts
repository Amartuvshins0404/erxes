import { deriveServiceToken, signServiceRequest } from './serviceAuth';

export const serializeServiceAuthBody = (input: unknown): string =>
  JSON.stringify(input) ?? '';

let currentServiceName: string | undefined;

export const setCurrentServiceName = (name: string): void => {
  currentServiceName = name;
};

export const getCurrentServiceName = (): string | undefined =>
  currentServiceName;

const resolveServiceToken = (serviceName: string): string | undefined => {
  const token = process.env.ERXES_SERVICE_TOKEN;

  if (token) {
    return token;
  }

  const masterKey = process.env.ERXES_MASTER_KEY;

  return masterKey ? deriveServiceToken(masterKey, serviceName) : undefined;
};

export const buildServiceAuthHeader = ({
  subdomain,
  path,
  input,
}: {
  subdomain: string;
  path: string;
  input: unknown;
}): string | undefined => {
  const serviceName = getCurrentServiceName();

  if (!serviceName) {
    return undefined;
  }

  const token = resolveServiceToken(serviceName);

  if (!token) {
    return undefined;
  }

  return signServiceRequest({
    serviceName,
    token,
    subdomain,
    path,
    body: serializeServiceAuthBody(input),
  });
};
