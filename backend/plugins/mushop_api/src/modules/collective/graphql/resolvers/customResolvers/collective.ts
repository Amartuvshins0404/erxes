import { getEnv } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { ICollectiveDocument } from '@/collective/@types/collective';

const toFileUrl = (
  key: string | undefined,
  subdomain: string,
): string | null => {
  if (!key) return null;

  if (key.startsWith('http://') || key.startsWith('https://')) return key;

  const COLLECTIVE_DOMAIN = getEnv({
    name: 'SUPPLIER_API_URL',
    subdomain,
    defaultValue: 'http://localhost:4000',
  });

  if (!COLLECTIVE_DOMAIN) return null;

  const domain = COLLECTIVE_DOMAIN.replace('<subdomain>', subdomain);

  return `${domain}/read-file?key=${key}`;
};

export const MushopCollective = {
  suppliers: async (
    { supplierIds = [] }: ICollectiveDocument,
    _args: unknown,
    { models }: IContext,
  ) => {
    if (!supplierIds.length) return [];
    return models.Supplier.find({ _id: { $in: supplierIds } }).lean();
  },
  address: ({ address }: ICollectiveDocument) => {
    if (!address || typeof address !== 'object') return address;

    const details = (address as any).details ?? (address as any).address;
    const next: any = { ...address, details };

    if ('address' in next) {
      delete next.address;
    }

    return next;
  },
  logo: ({ logo, targetSubdomain }: ICollectiveDocument) =>
    toFileUrl(logo, targetSubdomain),
  coverImage: ({ coverImage, targetSubdomain }: ICollectiveDocument) =>
    toFileUrl(coverImage, targetSubdomain),
};

export const MushopCollectiveSyncResult = {
  supplier: async (
    { supplierId }: { supplierId: string },
    _args: unknown,
    { models }: IContext,
  ) => {
    if (!supplierId) return null;
    return models.Supplier.findOne({ _id: supplierId }).lean();
  },
};
