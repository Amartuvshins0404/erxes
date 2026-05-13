import { IUser } from 'ui-modules';

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
  certificatePhotos?: string[];
  createdAt: string;
  updatedAt: string;
  member?: IUser;
}
