import { IPageInfo } from 'ui-modules';

export interface ISupplier {
  _id: string;
  name?: string;
  code?: string;
  description?: string;
  about?: string;
  logo?: string;
  coverImage?: string;
  registrationNumber?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  emails?: string[];
  phones?: string[];
  website?: string;
  dateFounded?: string;
  verificationStatus?: string;
  tierLevel?: number;
  address?: {
    short?: string;
    details?: { city?: string; city_district?: string };
  };
  createdAt?: string;
  updatedAt?: string;
  socialLinks?: Record<string, string>;
  posToken?: string;
}

export interface ISupplierList {
  list: ISupplier[];
  pageInfo: IPageInfo;
  totalCount?: number;
}
