import { IAttachment } from 'erxes-api-shared/core-types';
import { Document } from 'mongoose';
import { IBlock } from '~/types';

/**
 * Core user summary denormalized by `blockagency_api`. The user lives in the
 * agency tenant, so block admin can only read what the sync sends.
 */
export interface IBlockAdminAgentUser {
  _id?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  email?: string | null;
}

/**
 * An agency member (agent) mirrored from `blockagency_api`.
 *
 * - `entityId` is the agency-side member id.
 * - `agencyId` is the agency-side agency id, i.e. `Agency.entityId`, not the
 *   block admin `Agency._id`.
 */
export interface IBlockAdminAgent extends IBlock {
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
  certificatePhotos?: IAttachment[];
  user?: IBlockAdminAgentUser | null;
}

export interface IBlockAdminAgentDocument extends IBlockAdminAgent, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentQueryParams {
  agencyId?: string;
  subdomain?: string;
  role?: string;
  searchValue?: string;
}
