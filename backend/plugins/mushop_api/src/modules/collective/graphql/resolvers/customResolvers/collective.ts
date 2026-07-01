import { IContext } from '~/connectionResolvers';
import { ICollectiveDocument } from '@/collective/@types/collective';
import { toFileUrl } from '~/utils/fileUrl';

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
