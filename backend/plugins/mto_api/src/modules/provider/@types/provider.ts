import { Document } from 'mongoose';

export enum ProviderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface IMultilingualString {
  en: string;
  mn: string;
}

export interface IMultilingualStringOptional {
  en?: string;
  mn?: string;
}

export interface IContactInfo {
  phone: string;
  email: string;
  website?: string;
}

export interface IProvider {
  businessName: IMultilingualString;
  description?: IMultilingualStringOptional;
  contactInfo: IContactInfo;
  facilities?: string[];
  associationIds: string[];
  singleProviderLimit?: number;
  status: ProviderStatus;
  rejectionReason?: string;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedBy?: string;
  isActive?: boolean;
  icon?: string;
  coverImages?: string[];
  instanceId?: string;
  createdAt?: Date;
  modifiedAt?: Date;
}

export interface IProviderDocument extends Document, IProvider {
  _id: string;
  createdAt: Date;
  modifiedAt: Date;
}
