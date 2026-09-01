import { z } from 'zod';
import { AgencyAttachment } from '~/modules/agency/types/form';
import { agentFormSchema } from '../schema/member';

export interface IBlockAgencyMember {
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
  createdAt: Date;
  updatedAt: Date;
}

export type TAgentForm = z.infer<typeof agentFormSchema>;

export interface IBlockAgencyUserDetails {
  __typename?: string;
  avatar?: string | null;
  coverPhoto?: string | null;
  fullName?: string | null;
  shortName?: string | null;
  birthDate?: string | null;
  position?: string | null;
  workStartedDate?: string | null;
  location?: string | null;
  description?: string | null;
  operatorPhone?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  employeeId?: string | null;
}

export interface IBlockAgencyMemberUser {
  _id: string;
  username?: string | null;
  email?: string | null;
  details?: IBlockAgencyUserDetails | null;
}
