import { IAddress } from 'erxes-api-shared/core-types';
import { Document } from 'mongoose';
import { IBlock } from '~/types';

export interface IBlockDeveloperSocialLink {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  website?: string;
}
export interface IBlockDeveloper extends IBlock {
  name: string;

  about: string;
  description: string;

  logo: string;
  coverImage: string;

  registrationNumber: string;

  address: IAddress;

  primaryEmail: string;
  primaryPhone: string;

  phones: string[];
  emails: string[];

  dateFounded: string;
  website: string;
  verificationStatus: string;

  socialLinks: IBlockDeveloperSocialLink;
  tierLevel?: number;

  visibility?: 'public' | 'private';
}

export interface IBlockDeveloperDocument extends IBlockDeveloper, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeveloperQueryParams {
  searchValue?: string;
  verificationStatus?: string;
  city?: string;
  district?: string;
  dateFilters?: string;
  isFeatured?: boolean
}
