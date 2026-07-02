import { Document } from 'mongoose';

export const COLLECTIVE_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  ACTIVE: 'active',
  FAILED: 'failed',
  ALL: ['pending', 'syncing', 'active', 'failed'],
};

export interface ICollectiveSupplierSyncResult {
  supplierId: string;
  subdomain?: string;
  total: number;
  created: number;
  failed: number;
  errors?: string[];
}

export interface ICollectiveSocialLink {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  website?: string;
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
  address?: any;
  primaryEmail?: string;
  primaryPhone?: string;
  emails?: string[];
  phones?: string[];
  dateFounded?: string;
  website?: string;
  paymentId?: string;
  socialLinks?: ICollectiveSocialLink;
  ownerUserId?: string;

  targetSubdomain: string;
  targetPosToken?: string;
  supplierIds: string[];
  status?: string;
  syncResults?: ICollectiveSupplierSyncResult[];
  totalCreated?: number;
  totalFailed?: number;
  lastSyncedAt?: Date;
}

export interface ICollectiveDocument extends ICollective, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectiveQueryParams {
  searchValue?: string;
  status?: string;
  targetSubdomain?: string;
  supplierId?: string;
}

export interface ICollectiveProfileInput {
  name?: string;
  description?: string;
  about?: string;
  logo?: string;
  coverImage?: string;
  attachments?: string[];
  urls?: string[];
  registrationNumber?: string;
  address?: any;
  primaryEmail?: string;
  primaryPhone?: string;
  emails?: string[];
  phones?: string[];
  dateFounded?: string;
  website?: string;
  paymentId?: string;
  socialLinks?: ICollectiveSocialLink;
}
