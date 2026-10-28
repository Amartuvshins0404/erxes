import { ICursorPaginateParams, Resolver } from 'erxes-api-shared/core-types';
import {
  cursorPaginate,
  cursorPaginateAggregation,
} from 'erxes-api-shared/utils';
import type { FilterQuery, PipelineStage } from 'mongoose';

import { IContext } from '~/connectionResolvers';
import { IPipelineDocument } from '~/modules/sales/@types';
import { SALES_STATUSES, VISIBILITIES } from '~/modules/sales/constants';
import { getPipelineAccessFilter } from '~/modules/sales/utils/structureAccess';

// Keep legacy pipelines without a status in the active group and cursor.
const PIPELINE_STATUS_RANK_STAGE: PipelineStage = {
  $addFields: {
    statusRank: {
      $cond: [{ $eq: ['$status', SALES_STATUSES.ARCHIVED] }, 1, 0],
    },
  },
};

const PIPELINES_ORDER_BY = {
  statusRank: 1,
  createdAt: -1,
  _id: 1,
} as const;

export const pipelineQueries: Record<string, Resolver> = {
  /**
   *  Pipelines list
   */
  async salesPipelines(
    _root,
    params: {
      boardId: string;
      isAll: boolean;
    } & ICursorPaginateParams,
    { user, models, subdomain }: IContext,
  ) {
    const { boardId, isAll } = params;

    const query: FilterQuery<IPipelineDocument> =
      user.isOwner || isAll
        ? {}
        : await getPipelineAccessFilter(models, subdomain, user);

    // Owners may see private pipelines; only management callers see archived ones.
    if (!isAll) {
      query.status = { $ne: SALES_STATUSES.ARCHIVED };
    }

    if (boardId) {
      query.boardId = boardId;
    }

    const { list, totalCount, pageInfo } =
      await cursorPaginateAggregation<IPipelineDocument>({
        model: models.Pipelines,
        pipeline: [{ $match: query }, PIPELINE_STATUS_RANK_STAGE],
        params: {
          ...params,
          orderBy: PIPELINES_ORDER_BY,
          limit: params.limit || 20,
        },
        // Cursor dates are encoded as ISO strings.
        formatter: { createdAt: 'date' },
      });

    return { list, totalCount, pageInfo };
  },

  async cpSalesPipelines(
    _root,
    params: {
      boardId: string;
      isAll: boolean;
    } & ICursorPaginateParams,
    { user, models, subdomain }: IContext,
  ) {
    const { boardId, isAll } = params;

    const query: FilterQuery<IPipelineDocument> = {};

    if (!user?.isOwner && !isAll) {
      query.status = { $ne: SALES_STATUSES.ARCHIVED };
      Object.assign(
        query,
        user?._id
          ? await getPipelineAccessFilter(models, subdomain, user)
          : { visibility: VISIBILITIES.PUBLIC },
      );
    }

    if (boardId) {
      query.boardId = boardId;
    }

    const { list, totalCount, pageInfo } =
      await cursorPaginate<IPipelineDocument>({
        model: models.Pipelines,
        params: {
          ...params,
          orderBy: { createdAt: -1 },
          limit: params.limit || 20,
        },
        query: query,
      });

    return { list, totalCount, pageInfo };
  },

  async salesPipelineStateCount(
    _root,
    { boardId }: { boardId: string },
    { models }: IContext,
  ) {
    const query: any = {};

    if (boardId) {
      query.boardId = boardId;
    }

    const counts: any = {};
    const now = new Date();

    const notStartedQuery = {
      ...query,
      startDate: { $gt: now },
    };

    const notStartedCount =
      await models.Pipelines.find(notStartedQuery).countDocuments();

    counts['Not started'] = notStartedCount;

    const inProgressQuery = {
      ...query,
      startDate: { $lt: now },
      endDate: { $gt: now },
    };

    const inProgressCount =
      await models.Pipelines.find(inProgressQuery).countDocuments();

    counts['In progress'] = inProgressCount;

    const completedQuery = {
      ...query,
      endDate: { $lt: now },
    };

    const completedCounted =
      await models.Pipelines.find(completedQuery).countDocuments();

    counts.Completed = completedCounted;

    counts.All = notStartedCount + inProgressCount + completedCounted;

    return counts;
  },

  /**
   *  Pipeline detail
   */
  async salesPipelineDetail(
    _root,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    return models.Pipelines.findOne({ _id }).lean();
  },

  /**
   *  Pipeline related assigned users
   */
  async salesPipelineAssignedUsers(
    _root,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    const pipeline = await models.Pipelines.getPipeline(_id);
    const stageIds = await models.Stages.find({
      pipelineId: pipeline._id,
    }).distinct('_id');

    const assignedUserIds = await models.Deals.find({
      stageId: { $in: stageIds },
    }).distinct('assignedUserIds');

    return assignedUserIds.map((userId) => ({
      __typename: 'User',
      _id: userId || '',
    }));
  },
};

pipelineQueries.cpSalesPipelines.wrapperConfig = {
  forClientPortal: true,
};
