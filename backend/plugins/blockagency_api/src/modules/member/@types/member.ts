import { IAttachment } from 'erxes-api-shared/core-types';
import { Document } from 'mongoose';

export interface IBlockAgencyMember {
  agencyId?: string;
  memberId?: string;
  description?: string;
  country?: string;
  city?: string;
  district?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedUrl?: string;
  certificatePhotos?: IAttachment[];
  role?: 'admin' | 'lead' | 'member';
}

export interface IBlockAgencyAddMembersInput {
  agencyId: string;
  memberId: string;
}

/**
 * Core user summary denormalized onto the member payload sent to block admin.
 */
export interface IBlockAgencyMemberUser {
  _id: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  email?: string | null;
}

export interface IBlockAgencySyncedMember extends IBlockAgencyMember {
  _id: string;
  user: IBlockAgencyMemberUser | null;
}

export interface IBlockAgencyMemberDocument
  extends IBlockAgencyMember, Document<string> {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
