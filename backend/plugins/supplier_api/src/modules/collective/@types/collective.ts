import { Document } from 'mongoose';

export interface ICollectiveSocialLink {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  website?: string;
}

export interface ICollectiveAddressDetails {
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

export interface ICollectiveAddress {
  details?: ICollectiveAddressDetails;
  address?: ICollectiveAddressDetails;
  location?: {
    type?: string;
    coordinates?: number[];
  };
  short?: string;
  id?: string;
}

export interface ICollective {
  name?: string;
  description?: string;
  about?: string;
  logo?: string;
  coverImage?: string;
  attachments?: string[];
  urls?: string[];
  registrationNumber?: string;
  address?: ICollectiveAddress;
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
  socialLinks?: ICollectiveSocialLink;
  ownerUserId?: string;
}

export interface ICollectiveDocument extends ICollective, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
