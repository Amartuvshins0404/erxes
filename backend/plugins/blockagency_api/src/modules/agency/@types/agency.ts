import { IAttachment } from 'erxes-api-shared/core-types';
import { Document } from 'mongoose';
import { SOCIAL_PLATFORMS } from '~/constants';

export type ISocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface IBlockAgencyOperationArea {
  city?: string;
  district?: string;
}

export interface IBlockAgencyFieldOfExpertise {
  propertyTypes?: string[];
  services?: string[];
  clientTypes?: string[];
}

export interface IBlockAgency {
  name: string;
  brandName: string;
  type: string;
  description: string;
  brief: string;
  dateFounded: string;
  website: string;
  emails: string[];
  primaryEmail: string;
  phones: string[];
  primaryPhone: string;
  logo: IAttachment;
  coverImage: IAttachment;
  documents: IAttachment[];
  socialLinks: Partial<Record<ISocialPlatform, string>>;
  operationArea: IBlockAgencyOperationArea;
  fieldsOfExpertise: IBlockAgencyFieldOfExpertise;
  messengerIntegrationId: string;
  widgetBundleUrl: string;
  verificationStatus: string;
  rejectionReasons?: string[];
  rejectionNotes?: string;
}

export interface IBlockAgencyDocument extends IBlockAgency, Document<string> {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
