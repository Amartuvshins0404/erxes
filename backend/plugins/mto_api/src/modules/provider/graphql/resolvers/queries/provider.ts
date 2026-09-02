import { ICursorPaginateParams, Resolver } from 'erxes-api-shared/core-types';
import {
  cursorPaginate,
  escapeRegExp,
  markResolvers,
} from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { isSlaveMode } from '~/constants/mode';

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
      {
        address: {
          $regex: `.*${escaped}.*`,
          $options: 'i',
        },
      },
      {
        certificateNo: {
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

const scopedInstanceId = (context: IContext): string | undefined => {
  if (isSlaveMode()) {
    return context.instanceId;
  }

  return context.instanceIdFromHeader;
};

export const providerQueries: Record<string, Resolver> = {
  async mtoProfiles(
    _root: undefined,
    params: IProviderQueryParams,
    context: IContext,
  ) {
    const { models } = context;

    const filter = await generateFilter(params, scopedInstanceId(context));

    return await cursorPaginate({
      model: models.Provider,
      params,
      query: filter,
    });
  },

  async mtoProfilesCount(
    _root: undefined,
    params: IProviderQueryParams,
    context: IContext,
  ) {
    const { models } = context;

    const filter = await generateFilter(params, scopedInstanceId(context));
    return models.Provider.find(filter).countDocuments();
  },

  async mtoProfile(
    _root: undefined,
    { _id }: { _id: string },
    context: IContext,
  ) {
    const { models } = context;
    const instanceId = scopedInstanceId(context);

    const provider = await models.Provider.findOne({ _id });
    if (provider && instanceId && provider.instanceId !== instanceId) {
      return null;
    }
    return provider;
  },

  async mtoMyProfile(_root: undefined, _args: unknown, context: IContext) {
    const { models, instanceId } = context;

    const filter = instanceId
      ? { instanceId }
      : {
          $or: [
            { instanceId: { $exists: false } },
            { instanceId: null },
            { instanceId: '' },
          ],
        };

    return models.Provider.findOne(filter).sort({ createdAt: 1 });
  },
};
markResolvers(providerQueries, {
  wrapperConfig: {
    skipPermission: true,
  },
});
