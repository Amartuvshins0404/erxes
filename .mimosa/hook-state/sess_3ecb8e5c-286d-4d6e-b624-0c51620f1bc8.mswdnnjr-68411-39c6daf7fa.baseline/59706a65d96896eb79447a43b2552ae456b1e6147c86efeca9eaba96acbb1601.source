import { socialPlatforms } from '../constants/social-platforms';

export interface IAgencyOperationArea {
  city: string;
  district: string;
}

export interface IAgencyFieldOfExpertise {
  propertyTypes: string[];
  services: string[];
  clientTypes: string[];
}

export interface IAgency {
  _id: string;
  entityId?: string;
  name: string;
  brandName: string;
  type: string;
  description: string;
  brief: string;
  logo: string;
  coverImage: string;
  documents: string[];
  primaryEmail?: string;
  emails?: string[];
  phones?: string[];
  primaryPhone?: string;
  website?: string;
  socialLinks: SocialPlatform;
  dateFounded: string;
  operationArea: IAgencyOperationArea;
  fieldsOfExpertise: IAgencyFieldOfExpertise;
  messengerIntegrationId?: string;
  widgetBundleUrl?: string;
  verificationStatus: string;
}

export type SocialPlatform = (typeof socialPlatforms)[number];

export enum AgencyRejectionReasons {
  INCOMPLETE_DOCUMENTS = 'Incomplete documents',
  INVALID_LICENSE = 'Invalid license',
  DUPLICATE_ACCOUNT = 'Duplicate account',
  SUSPICIOUS_ACTIVITY = 'Suspicious activity',
}

export type TViewMode = 'grid' | 'list';
