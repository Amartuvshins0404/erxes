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
  logo?: AgencyAttachment | null;
  coverImage?: AgencyAttachment | null;
  documents?: AgencyAttachment[] | null;
  primaryEmail?: string;
  emails?: string[];
  phones?: string[];
  primaryPhone?: string;
  website?: string;
  socialLinks?: IAgencySocialLinks;
  dateFounded: string;
  operationArea: IAgencyOperationArea;
  fieldsOfExpertise: IAgencyFieldOfExpertise;
  messengerIntegrationId?: string;
  widgetBundleUrl?: string;
  verificationStatus: string;
  rejectionReasons?: string[];
  rejectionNotes?: string;
}

export type SocialPlatform = (typeof socialPlatforms)[number];

export type IAgencySocialLinks = Partial<Record<SocialPlatform, string>>;

export enum AgencyRejectionReasons {
  INCOMPLETE_DOCUMENTS = 'Incomplete documents',
  INVALID_LICENSE = 'Invalid license',
  DUPLICATE_ACCOUNT = 'Duplicate account',
  SUSPICIOUS_ACTIVITY = 'Suspicious activity',
}

export type TViewMode = 'grid' | 'list';

export interface IAgencyAgentUser {
  _id?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  email?: string | null;
}

/**
 * An agency member mirrored into block admin by the agency tenant. The user
 * summary is denormalized at sync time, so it is all block admin knows about
 * the person behind the agent.
 */
export interface IAgencyAgent {
  _id: string;
  agencyId?: string;
  memberId?: string;
  role?: string;
  description?: string;
  country?: string;
  city?: string;
  district?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedUrl?: string;
  user?: IAgencyAgentUser | null;
  createdAt?: string;
  updatedAt?: string;
}

export type AgencyAttachment = {
  name: string;
  url: string;
  type?: string | null | undefined;
  size?: number | null | undefined;
  duration?: number | null | undefined;
};
