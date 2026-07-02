import { IMushopSupplierDocument } from '~/modules/supplier/@types/supplier';
import { toFileUrl } from '~/utils/fileUrl';

export const MushopSupplier = {
  address: ({ address }: IMushopSupplierDocument) => {
    if (!address || typeof address !== 'object') return address;

    const details = (address as any).details ?? (address as any).address;
    const next: any = { ...address, details };

    if ('address' in next) {
      delete next.address;
    }

    return next;
  },
  logo: ({ logo, subdomain }: IMushopSupplierDocument) =>
    toFileUrl(logo, subdomain),
  coverImage: ({ coverImage, subdomain }: IMushopSupplierDocument) =>
    toFileUrl(coverImage, subdomain),
  attachments: ({ attachments, subdomain }: IMushopSupplierDocument) =>
    Array.isArray(attachments)
      ? attachments.map((key) => toFileUrl(key, subdomain))
      : null  
};
