import { getEnv } from 'erxes-api-shared/utils';

const NODE_ENV = getEnv({ name: 'NODE_ENV', defaultValue: 'development' });

export const toFileUrl = (
  key: string | undefined,
  subdomain: string,
): string | null => {
  if (!key) return null;

  if (key.startsWith('http://') || key.startsWith('https://')) return key;

  if (NODE_ENV === 'development') {
    return `http://localhost:4000/read-file?key=${key}`;
  }

  const SUPPLIER_DOMAIN = getEnv({
    name: 'SUPPLIER_API_URL',
    subdomain,
    defaultValue: 'http://localhost:4000',
  });

  if (!SUPPLIER_DOMAIN) return null;

  const domain = SUPPLIER_DOMAIN.replace('<subdomain>', subdomain);

  return `${domain}/read-file?key=${key}`;
};

export const resolveAttachmentUrl = (attachment: any, subdomain: string) => {
  if (!attachment || typeof attachment.url !== 'string') return attachment;

  const url = toFileUrl(attachment.url, subdomain);

  return url ? { ...attachment, url } : attachment;
};
