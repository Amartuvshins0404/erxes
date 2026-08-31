import { Resolver } from 'erxes-api-shared/core-types';
import { cursorPaginate, escapeRegExp } from 'erxes-api-shared/utils';
import { FilterQuery } from 'mongoose';

import {
  IMeetingDocument,
  IMeetingListParams,
} from '@/meeting/@types/meeting';
import { IContext } from '~/connectionResolvers';

const generateFilter = (params: IMeetingListParams) => {
  const filter: FilterQuery<IMeetingDocument> = {};

  if (params.searchValue) {
    const regex = new RegExp(escapeRegExp(params.searchValue), 'i');

    filter.$or = [{ title: regex }, { location: regex }, { note: regex }];
  }

  if (params.subdomain) {
    filter.subdomain = params.subdomain;
  }

  if (params.status) {
    filter.status = params.status;
  }

  if (params.source) {
    filter.source = params.source;
  }

  if (params.scheduledFrom || params.scheduledTo) {
    filter.scheduledAt = {
      ...(params.scheduledFrom ? { $gte: new Date(params.scheduledFrom) } : {}),
      ...(params.scheduledTo ? { $lte: new Date(params.scheduledTo) } : {}),
    };
  }

  return filter;
};

export const meetingQueries: Record<string, Resolver> = {
  async oroltsooAdminMeetings(
    _root: undefined,
    params: IMeetingListParams,
    { models }: IContext,
  ) {
    return cursorPaginate<IMeetingDocument>({
      model: models.Meeting,
      params: { orderBy: { scheduledAt: -1 }, ...params },
      query: generateFilter(params),
    });
  },

  async oroltsooAdminMeetingDetail(
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    return models.Meeting.getMeeting(_id);
  },
};
