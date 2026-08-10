import { IBaSupplierDocument } from '@/supplier/profile/@types/supplier';
import { toFileUrl } from '@/supplier/utils/fileUrl';

export const BaSupplier = {
  address: ({ address }: IBaSupplierDocument) => {
    if (!address || typeof address !== 'object') return address;

    const details = (address as any).details ?? (address as any).address;
    const next: any = { ...address, details };

    if ('address' in next) {
      delete next.address;
    }

    return next;
  },
  logo: ({ logo, subdomain }: IBaSupplierDocument) =>
    toFileUrl(logo, subdomain),
  coverImage: ({ coverImage, subdomain }: IBaSupplierDocument) =>
    toFileUrl(coverImage, subdomain),
  attachments: ({ attachments, subdomain }: IBaSupplierDocument) =>
    Array.isArray(attachments)
      ? attachments.map((key) => toFileUrl(key, subdomain))
      : null,
};
