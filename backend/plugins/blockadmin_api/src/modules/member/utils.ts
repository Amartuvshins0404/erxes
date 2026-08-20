import {
  AgentQueryParams,
  IBlockAdminAgentDocument,
} from '@/member/@types/member';
import { FilterQuery } from 'mongoose';
import { IModels } from '~/connectionResolvers';

/**
 * Block admin ids are local, while every synced record is keyed by the tenant
 * it came from. Both lookups below translate a local `_id` into that pair.
 */
export interface ISyncKeys {
  subdomain: string;
  entityId: string;
}

export const resolveAgencyKeys = async (
  models: IModels,
  agencyId: string,
): Promise<ISyncKeys | null> => {
  const agency = await models.Agency.findOne({ _id: agencyId })
    .select('subdomain entityId')
    .lean();

  if (!agency?.subdomain || !agency?.entityId) {
    return null;
  }

  return { subdomain: agency.subdomain, entityId: String(agency.entityId) };
};

export const resolveAgentKeys = async (
  models: IModels,
  agentId: string,
): Promise<ISyncKeys | null> => {
  const agent = await models.AgencyMember.findOne({ _id: agentId })
    .select('subdomain entityId')
    .lean();

  if (!agent?.subdomain || !agent?.entityId) {
    return null;
  }

  return { subdomain: agent.subdomain, entityId: String(agent.entityId) };
};

export const generateFilter = (
  params: AgentQueryParams,
): FilterQuery<IBlockAdminAgentDocument> => {
  const { subdomain, agencyId, role, searchValue } = params;

  const filter: FilterQuery<IBlockAdminAgentDocument> = {};

  if (subdomain) filter.subdomain = subdomain;
  if (agencyId) filter.agencyId = agencyId;
  if (role) filter.role = role;

  if (searchValue) {
    const regex = { $regex: searchValue, $options: 'i' };

    filter.$or = [
      { 'user.firstName': regex },
      { 'user.lastName': regex },
      { 'user.email': regex },
    ];
  }

  return filter;
};
