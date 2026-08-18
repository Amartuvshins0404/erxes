import { z } from 'zod';
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
  certificatePhotos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type TAgentForm = z.infer<typeof agentFormSchema>;
