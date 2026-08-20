import { IUser } from 'ui-modules';
import { AgencyAttachment } from './form';

export interface IAgencyMember {
  _id: string;
  memberId: string;
  agencyId: string;
  role?: 'owner' | 'admin' | 'member';
  linkedUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  district?: string;
  description?: string;
  country?: string;
  city?: string;
  certificatePhotos?: AgencyAttachment[];
  createdAt: string;
  updatedAt: string;
  member?: IUser;
}
