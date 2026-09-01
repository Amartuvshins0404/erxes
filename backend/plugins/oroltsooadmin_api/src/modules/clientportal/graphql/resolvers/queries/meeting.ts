import { IOffsetPaginateParams, Resolver } from 'erxes-api-shared/core-types';
import { markResolvers, paginate } from 'erxes-api-shared/utils';
import { FilterQuery } from 'mongoose';

import {
  ICpMeetingUser,
  IMeetingDocument,
} from '@/meeting/@types/meeting';
import { IContext } from '~/connectionResolvers';
import { MEETING_STATUSES } from '~/constants';

export interface ICpMeetingQueryParams {
  subdomain?: string;
  status?: string;
  scheduledFrom?: Date;
  scheduledTo?: Date;
}

const buildOwnFilter = (
  cpUserId: string,
  params: ICpMeetingQueryParams,
): FilterQuery<IMeetingDocument> | null => {
  const filter: FilterQuery<IMeetingDocument> = {
    'requestedBy.cpUserId': cpUserId,
  };

  if (params.subdomain) {
    filter.subdomain = params.subdomain;
  }

  if (params.status) {
    if (!MEETING_STATUSES.ALL.includes(params.status)) {
      return null;
    }

    filter.status = params.status;
  }

  if (params.scheduledFrom || params.scheduledTo) {
    filter.scheduledAt = {
      ...(params.scheduledFrom ? { $gte: new Date(params.scheduledFrom) } : {}),
      ...(params.scheduledTo ? { $lte: new Date(params.scheduledTo) } : {}),
    };
  }

  return filter;
};

export const cpMeetingQueries: Record<string, Resolver> = {
  async cpGetOroltsooMeetingRequests(
    _root: undefined,
    params: ICpMeetingQueryParams & IOffsetPaginateParams,
    { models, cpUser }: IContext,
  ) {
    const {
      page,
      perPage,
      sortField = 'scheduledAt',
      sortDirection = 'desc',
    } = params;

    const requester: ICpMeetingUser = cpUser || {};

    if (!requester._id) {
      return [];
    }

    const filter = buildOwnFilter(requester._id, params);

    if (!filter) {
      return [];
    }

    return paginate(
      models.Meeting.find(filter)
        .sort({ [sortField]: sortDirection })
        .lean(),
      { page, perPage },
    );
  },
};

markResolvers(cpMeetingQueries, {
  wrapperConfig: {
    forClientPortal: true,
    cpUserRequired: true,
  },
});
