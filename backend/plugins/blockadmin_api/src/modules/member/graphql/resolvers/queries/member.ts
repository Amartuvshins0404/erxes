import {
  AgentQueryParams,
  IBlockAdminAgentDocument,
} from '@/member/@types/member';
import { generateFilter, resolveAgencyKeys } from '@/member/utils';
import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { cursorPaginate } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { EMPTY_CURSOR_LIST } from '~/utils';

export const agentQueries = {
  getBlockAdminAgencyAgentInfo: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return await models.AgencyMember.findOne({ _id }).lean();
  },


  getBlockAdminAgencyAgents: async (
    _root: undefined,
    params: { agencyId?: string } & Omit<AgentQueryParams, 'agencyId'> &
      ICursorPaginateParams,
    { models }: IContext,
  ) => {
    const { agencyId, ...rest } = params;

    let filterParams: AgentQueryParams = rest;

    if (agencyId) {
      const keys = await resolveAgencyKeys(models, agencyId);

      if (!keys) {
        return EMPTY_CURSOR_LIST;
      }

      filterParams = {
        ...rest,
        subdomain: keys.subdomain,
        agencyId: keys.entityId,
      };
    }

    const { list, pageInfo, totalCount } =
      await cursorPaginate<IBlockAdminAgentDocument>({
        model: models.AgencyMember,
        params,
        query: generateFilter(filterParams),
      });

    return { list, pageInfo, totalCount };
  },
};
