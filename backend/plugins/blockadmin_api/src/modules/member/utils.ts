import { IBlockAgencyDocument } from '@/agency/@types/agency';
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

/**
 * Reverse of `resolveAgencyKeys`: an agent only carries the agency-side keys
 * (`subdomain` + `agencyId`, i.e. `Agency.entityId`), so its block admin agency
 * has to be looked up by that pair. Agencies synced before `entityId` was
 * recorded are still reachable through `subdomain` alone, which is unique per
 * mirrored agency tenant.
 */
export const findAgentAgency = async (
  models: IModels,
  { subdomain, agencyId }: { subdomain?: string; agencyId?: string },
) => {
  if (!subdomain) {
    return null;
  }

  const filter: FilterQuery<IBlockAgencyDocument> = { subdomain };

  if (agencyId) {
    filter.entityId = agencyId;
  }

  return (
    (await models.Agency.findOne(filter).lean()) ||
    (agencyId ? await models.Agency.findOne({ subdomain }).lean() : null)
  );
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
