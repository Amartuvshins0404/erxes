import { Document } from 'mongoose';

export interface ISupplierSocialLink {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  website?: string;
}

export interface ISupplierAddressDetails {
  countryCode?: string;
  country?: string;
  postCode?: string;
  city?: string;
  city_district?: string;
  suburb?: string;
  road?: string;
  street?: string;
  building?: string;
  number?: string;
  other?: string;
}

export interface ISupplierAddress {
  details?: ISupplierAddressDetails;
  // Backward-compat: legacy key (will be normalized on save/return)
  address?: ISupplierAddressDetails;
  location?: {
    type?: string;
    coordinates?: number[];
  };
  short?: string;
  id?: string;
}

export interface ISupplier {
  code?: string;
  name?: string;
  description?: string;
  about?: string;
  logo?: string;
  coverImage?: string;
  attachments?: string[];
  urls?: string[];
  registrationNumber?: string;
  address?: ISupplierAddress;
  primaryEmail?: string;
  primaryPhone?: string;
  emails?: string[];
  phones?: string[];
  dateFounded?: string;
  website?: string;
  paymentId?: string;
  verificationStatus?: string;
  verificationNote?: string;
  tierLevel?: number;
  socialLinks?: ISupplierSocialLink;
  ownerUserId?: string;
}

export interface ISupplierDocument extends ISupplier, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierQueryParams {
  searchValue?: string;
  verificationStatus?: string;
  city?: string;
  district?: string;
  dateFilters?: string;
  isFeatured?: boolean;
}
