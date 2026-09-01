import { AgencyQueryParams } from '@/agency/@types/agency';
import { generateFilter } from '@/agency/utils';
import { AgentQueryParams } from '@/member/@types/member';
import {
  generateFilter as generateAgentFilter,
  resolveAgencyKeys,
} from '@/member/utils';
import { IOffsetPaginateParams } from 'erxes-api-shared/core-types';
import { markResolvers, paginate } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';

export const cpAgencyQueries = {
  cpGetBlockAdminAgencyInfo: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    const agency = await models.Agency.findOne({ _id }).lean();

    if (!agency) {
      throw new Error('Agency not found');
    }

    return agency;
  },

  cpGetBlockAdminAgencies: async (
    _root: undefined,
    params: AgencyQueryParams & IOffsetPaginateParams,
    { models }: IContext,
  ) => {
    const {
      verificationStatus,
      page,
      perPage,
      sortField = 'createdAt',
      sortDirection = 'desc',
    } = params;

    const filter = await generateFilter(params);

    // `generateFilter` only covers search/city/district, so the client-portal
    // verification filter is applied here.
    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }

    return await paginate(
      models.Agency.find(filter)
        .sort({ [sortField]: sortDirection })
        .lean(),
      { page, perPage },
    );
  },

  cpBlockAdminAgentInfo: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    const agent = await models.AgencyMember.findOne({ _id }).lean();

    if (!agent) {
      throw new Error('Agent not found');
    }

    return agent;
  },

  /**
   * `agencyId` is the client-portal agency `_id`; agents are stored against the
   * agency-side ids, so it is translated before filtering.
   */
  cpBlockAdminAgents: async (
    _root: undefined,
    params: { agencyId?: string } & Omit<AgentQueryParams, 'agencyId'> &
      IOffsetPaginateParams,
    { models }: IContext,
  ) => {
    const {
      agencyId,
      role,
      searchValue,
      page,
      perPage,
      sortField = 'createdAt',
      sortDirection = 'desc',
    } = params;

    const filterParams: AgentQueryParams = { role, searchValue };

    if (agencyId) {
      const keys = await resolveAgencyKeys(models, agencyId);

      if (!keys) {
        return [];
      }

      filterParams.subdomain = keys.subdomain;
      filterParams.agencyId = keys.entityId;
    }

    return await paginate(
      models.AgencyMember.find(generateAgentFilter(filterParams))
        .sort({ [sortField]: sortDirection })
        .lean(),
      { page, perPage },
    );
  },
};

markResolvers(cpAgencyQueries, {
  wrapperConfig: {
    forClientPortal: true,
  },
});
