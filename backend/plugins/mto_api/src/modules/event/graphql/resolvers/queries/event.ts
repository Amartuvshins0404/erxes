import { Resolver } from 'erxes-api-shared/core-types';
import { escapeRegExp, markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';

interface IEventListParams {
  status?: string;
  isActive?: boolean;
  searchValue?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  categoryId?: string;
}

const buildEventFilter = (params: IEventListParams) => {
  const filter: Record<string, unknown> = {};

  if (params.status !== undefined) {
    filter.status = params.status;
  }

  if (params.isActive !== undefined) {
    filter.isActive = params.isActive;
  }

  if (params.categoryId) {
    filter.categoryIds = params.categoryId;
  }

  if (params.startDateFrom || params.startDateTo) {
    filter.startDate = {};

    if (params.startDateFrom) {
      (filter.startDate as Record<string, Date>).$gte = new Date(
        params.startDateFrom,
      );
    }

    if (params.startDateTo) {
      (filter.startDate as Record<string, Date>).$lte = new Date(
        params.startDateTo,
      );
    }
  }

  if (params.searchValue) {
    const escaped = escapeRegExp(params.searchValue);

    filter.$or = [
      {
        'title.en': {
          $regex: `.*${escaped}.*`,
          $options: 'i',
        },
      },
      {
        'title.mn': {
          $regex: `.*${escaped}.*`,
          $options: 'i',
        },
      },
      {
        location: {
          $regex: `.*${escaped}.*`,
          $options: 'i',
        },
      },
    ];
  }

  return filter;
};

export const eventQueries: Record<string, Resolver> = {
  async mtoEvents(
    _root: undefined,
    params: IEventListParams,
    { models }: IContext,
  ) {
    const filter = buildEventFilter(params);

    return models.Event.find(filter).sort({ startDate: -1 });
  },

  async mtoEvent(
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    return models.Event.findOne({ _id });
  },
};

markResolvers(eventQueries, {
  wrapperConfig: {
    skipPermission: true,
  },
});
