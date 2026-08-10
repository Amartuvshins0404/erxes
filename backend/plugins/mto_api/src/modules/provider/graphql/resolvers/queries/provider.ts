import { ICursorPaginateParams, Resolver } from 'erxes-api-shared/core-types';
import {
  cursorPaginate,
  escapeRegExp,
  markResolvers,
} from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';

export interface IProviderQueryParams extends ICursorPaginateParams {
  searchValue?: string;
  status?: string;
  categoryId?: string;
  isActive?: boolean;
  hasScheduleFutureOrNow?: boolean;
}

const generateFilter = async (
  params: IProviderQueryParams,
  instanceId?: string,
) => {
  const filter: any = {};

  if (instanceId) {
    filter.instanceId = instanceId;
  }

  if (params.searchValue) {
    const escaped = escapeRegExp(params.searchValue);

    filter.$or = [
      {
        'businessName.en': {
          $regex: `.*${escaped}.*`,
          $options: 'i',
        },
      },
      {
        'businessName.mn': {
          $regex: `.*${escaped}.*`,
          $options: 'i',
        },
      },
      {
        'description.en': {
          $regex: `.*${escaped}.*`,
          $options: 'i',
        },
      },
      {
        'description.mn': {
          $regex: `.*${escaped}.*`,
          $options: 'i',
        },
      },
    ];
  }

  if (params.status) {
    filter.status = params.status;
  }

  if (params.categoryId) {
    filter.categoryIds = params.categoryId;
  }

  if (params.isActive !== undefined) {
    filter.isActive = params.isActive;
  }

  if (params.hasScheduleFutureOrNow) {
    filter._id = { $in: [] };
  }

  return filter;
};

export const providerQueries: Record<string, Resolver> = {
  async mtoProviders(
    _root: undefined,
    params: IProviderQueryParams,
    context: IContext,
  ) {
    const { models, instanceId } = context;

    const filter = await generateFilter(params, instanceId);

    return await cursorPaginate({
      model: models.Provider,
      params,
      query: filter,
    });
  },

  async mtoProvidersCount(
    _root: undefined,
    params: IProviderQueryParams,
    context: IContext,
  ) {
    const { models, instanceId } = context;

    const filter = await generateFilter(params, instanceId);
    return models.Provider.find(filter).countDocuments();
  },

  async mtoProvider(
    _root: undefined,
    { _id }: { _id: string },
    context: IContext,
  ) {
    const { models, instanceId } = context;

    const provider = await models.Provider.findOne({ _id });
    if (provider && instanceId && provider.instanceId !== instanceId) {
      return null;
    }
    return provider;
  },
};
markResolvers(providerQueries, {
  wrapperConfig: {
    skipPermission: true,
  },
});
