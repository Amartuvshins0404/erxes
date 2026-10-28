import { Resolver } from 'erxes-api-shared/core-types';
import { defaultPaginate, regexSearchText } from 'erxes-api-shared/utils';

import type { FilterQuery } from 'mongoose';

import { IContext } from '~/connectionResolvers';
import { IStageDocument } from '~/modules/sales/@types';
import { SALES_STATUSES } from '~/modules/sales/constants';
import {
  getContainerAccessFilter,
  STAGE_MEMBER_FIELDS,
} from '~/modules/sales/utils/structureAccess';

export const stageQueries: Record<string, Resolver> = {
  /**
   *  Stages list
   */
  async salesStages(
    _root,
    {
      pipelineId,
      pipelineIds,
      isNotLost,
      isAll,
    }: {
      pipelineId: string;
      pipelineIds: string[];
      isNotLost: boolean;
      isAll: boolean;
    },
    { subdomain, user, models }: IContext,
  ) {
    const filter: FilterQuery<IStageDocument> = isAll
      ? {}
      : { status: { $ne: SALES_STATUSES.ARCHIVED } };

    filter.pipelineId = pipelineId;

    if (pipelineIds) {
      filter.pipelineId = { $in: pipelineIds };
    }

    if (isNotLost) {
      filter.probability = { $ne: 'Lost' };
    }

    if (!isAll && !user.isOwner) {
      Object.assign(
        filter,
        await getContainerAccessFilter(subdomain, user, STAGE_MEMBER_FIELDS),
      );
    }

    return models.Stages.find(filter).sort({ order: 1, createdAt: -1 }).lean();
  },

  async cpSalesStages(
    _root,
    {
      pipelineId,
      pipelineIds,
      isNotLost,
      isAll,
    }: {
      pipelineId: string;
      pipelineIds: string[];
      isNotLost: boolean;
      isAll: boolean;
    },
    { subdomain, user, models }: IContext,
  ) {
    const filter: any = {};

    filter.pipelineId = pipelineId;

    if (pipelineIds) {
      filter.pipelineId = { $in: pipelineIds };
    }

    if (isNotLost) {
      filter.probability = { $ne: 'Lost' };
    }

    if (!isAll) {
      filter.status = { $ne: SALES_STATUSES.ARCHIVED };

      if (user?._id) {
        Object.assign(
          filter,
          await getContainerAccessFilter(subdomain, user, STAGE_MEMBER_FIELDS),
        );
      } else {
        filter.visibility = { $in: ['public', null] };
      }
    }

    return models.Stages.find(filter).sort({ order: 1, createdAt: -1 }).lean();
  },

  /**
   *  Stage detail
   */
  async salesStageDetail(
    _root,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    return models.Stages.findOne({ _id }).lean();
  },

  /**
   *  Archived stages
   */

  async salesArchivedStages(
    _root,
    {
      pipelineId,
      search,
      ...listArgs
    }: { pipelineId: string; search?: string; page?: number; perPage?: number },
    { models }: IContext,
  ) {
    const filter: any = { pipelineId, status: SALES_STATUSES.ARCHIVED };

    if (search) {
      Object.assign(filter, regexSearchText(search, 'name'));
    }

    return defaultPaginate(
      models.Stages.find(filter).sort({ createdAt: -1 }),
      listArgs,
    );
  },

  async salesArchivedStagesCount(
    _root,
    { pipelineId, search }: { pipelineId: string; search?: string },
    { models }: IContext,
  ) {
    const filter: any = { pipelineId, status: SALES_STATUSES.ARCHIVED };

    if (search) {
      Object.assign(filter, regexSearchText(search, 'name'));
    }

    return models.Stages.countDocuments(filter);
  },
};

stageQueries.cpSalesStages.wrapperConfig = {
  forClientPortal: true,
};
