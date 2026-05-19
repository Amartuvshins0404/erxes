import type { Resolver } from 'erxes-api-shared/core-types';
import { paginate } from 'erxes-api-shared/utils';
import { FilterQuery } from 'mongoose';
import { IContext } from '~/connectionResolvers';
import {
  ICarCategoryDocument,
  ICarDocument,
  ICarsFilter,
} from '~/modules/car/@types/car';
import { ROOT_CAR_CONTENT_TYPE } from '~/modules/car/constants';
import { requireArrayResult, requireCoreTRPC } from '~/modules/car/core';
import {
  assertCanManageClientPortalCar,
  getClientPortalCarIds,
  resolveClientPortalEntityIds,
} from '~/modules/car/clientPortal';
import type { ClientPortalEntityInput } from '~/modules/car/clientPortal';
import {
  buildSearchRegex,
  getActiveCarsSelector,
  normalizeRelationContentType,
} from '~/modules/car/utils';

type CarResolver = Resolver<any, any, IContext>;
type CpCarsFilter = ICarsFilter & ClientPortalEntityInput;

const buildSort = ({ sortField, sortDirection }: ICarsFilter) => {
  if (!sortField) {
    return {};
  }

  return { [sortField]: sortDirection || 1 };
};

const generateCarsFilter = async (
  subdomain: string,
  commonQuerySelector: Record<string, any>,
  params: ICarsFilter,
) => {
  const filter: FilterQuery<ICarDocument> = {
    ...commonQuerySelector,
    ...getActiveCarsSelector(),
  };

  if (params.categoryId) {
    filter.categoryId = params.categoryId;
  }

  if (params.searchValue) {
    filter.searchText = buildSearchRegex(params.searchValue);
  }

  if (params.ids?.length) {
    filter._id = {
      [params.excludeIds ? '$nin' : '$in']: params.ids,
    };
  }

  if (params.tag) {
    filter.tagIds = { $in: [params.tag] };
  }

  if (
    params.conformityMainTypeId &&
    params.conformityMainType &&
    (params.conformityIsRelated || params.conformityIsSaved)
  ) {
    const relationIds = requireArrayResult<string>(
      await requireCoreTRPC({
        subdomain,
        module: 'relation',
        action: 'getRelationIds',
        input: {
          contentType: normalizeRelationContentType(params.conformityMainType),
          contentId: params.conformityMainTypeId,
          relatedContentType: ROOT_CAR_CONTENT_TYPE,
        },
      }),
      'Core relation.getRelationIds',
    );

    filter._id = { $in: relationIds };
  }

  if (params.segmentData && !params.segment) {
    // Raw segmentData parity needs platform segment-data support for plugin
    // content types. Keep public list queries stable instead of failing links
    // that carry the legacy arg.
    return filter;
  }

  if (params.segment) {
    const ids = requireArrayResult<string>(
      await requireCoreTRPC({
        subdomain,
        module: 'segment',
        action: 'fetchSegment',
        input: {
          segmentId: params.segment,
          options: {},
        },
      }),
      'Core segment.fetchSegment',
    );

    filter._id = { $in: ids };
  }

  return filter;
};

const generateCategoryFilter = (
  commonQuerySelector: Record<string, any>,
  params: { parentId?: string; searchValue?: string },
) => {
  const filter: FilterQuery<ICarCategoryDocument> = { ...commonQuerySelector };

  if (params.parentId) {
    filter.parentId = params.parentId;
  }

  if (params.searchValue) {
    filter.name = buildSearchRegex(params.searchValue);
  }

  return filter;
};

const generateClientPortalCarsFilter = async (
  subdomain: string,
  commonQuerySelector: Record<string, any>,
  params: CpCarsFilter,
  cpUser: IContext['cpUser'],
) => {
  const entityIds = resolveClientPortalEntityIds(cpUser, {
    customerId: params.customerId,
    companyId: params.companyId,
  });
  const relatedCarIds = await getClientPortalCarIds(subdomain, entityIds);
  const filter = await generateCarsFilter(
    subdomain,
    commonQuerySelector,
    params,
  );

  return {
    $and: [filter, { _id: { $in: relatedCarIds } }],
  };
};

export const carQueries: Record<string, CarResolver> = {
  async cars(
    _root,
    params: ICarsFilter,
    { subdomain, commonQuerySelector = {}, models, checkPermission }: IContext,
  ) {
    await checkPermission('showCars');

    const filter = await generateCarsFilter(
      subdomain,
      commonQuerySelector,
      params,
    );

    return await paginate(models.Cars.find(filter).sort(buildSort(params)), {
      page: params.page,
      perPage: params.perPage,
      ids: params.ids,
      excludeIds: params.excludeIds,
    });
  },

  async carsMain(
    _root,
    params: ICarsFilter,
    { subdomain, commonQuerySelector = {}, models, checkPermission }: IContext,
  ) {
    await checkPermission('showCars');

    const filter = await generateCarsFilter(
      subdomain,
      commonQuerySelector,
      params,
    );

    return {
      list: await paginate(models.Cars.find(filter).sort(buildSort(params)), {
        page: params.page,
        perPage: params.perPage,
        ids: params.ids,
        excludeIds: params.excludeIds,
      }),
      totalCount: await models.Cars.countDocuments(filter),
    };
  },

  async carDetail(
    _root,
    { _id }: { _id: string },
    { models, checkPermission }: IContext,
  ) {
    await checkPermission('showCars');

    return await models.Cars.getCar(_id);
  },

  async carCounts(
    _root,
    params: ICarsFilter & { only?: string },
    { checkPermission }: IContext,
  ) {
    await checkPermission('showCars');

    const counts = {
      bySegment: {},
      byTag: {},
    };

    return counts;
  },

  async carCountByTags(
    _root,
    _params,
    { subdomain, models, checkPermission }: IContext,
  ) {
    await checkPermission('showCars');

    const counts = {};
    const tags = requireArrayResult<{ _id: string }>(
      await requireCoreTRPC({
        subdomain,
        module: 'tags',
        action: 'find',
        input: {
          query: { type: ROOT_CAR_CONTENT_TYPE },
        },
      }),
      'Core tags.find',
    );

    for (const tag of tags) {
      counts[tag._id] = await models.Cars.countDocuments({
        ...getActiveCarsSelector(),
        tagIds: tag._id,
      });
    }

    return counts;
  },

  async carCategories(
    _root,
    params: { parentId?: string; searchValue?: string },
    { commonQuerySelector = {}, models, checkPermission }: IContext,
  ) {
    await checkPermission('showCars');

    return await models.CarCategories.find(
      generateCategoryFilter(commonQuerySelector, params),
    )
      .sort({ order: 1 })
      .lean();
  },

  async carCategoriesTotalCount(
    _root,
    _params,
    { commonQuerySelector = {}, models, checkPermission }: IContext,
  ) {
    await checkPermission('showCars');

    return await models.CarCategories.countDocuments(commonQuerySelector);
  },

  async carCategoryDetail(
    _root,
    { _id }: { _id: string },
    { models, checkPermission }: IContext,
  ) {
    await checkPermission('showCars');

    return await models.CarCategories.findOne({ _id });
  },

  async cpCars(
    _root,
    params: CpCarsFilter,
    { subdomain, commonQuerySelector = {}, models, cpUser }: IContext,
  ) {
    const filter = await generateClientPortalCarsFilter(
      subdomain,
      commonQuerySelector,
      params,
      cpUser,
    );

    return await paginate(models.Cars.find(filter).sort(buildSort(params)), {
      page: params.page,
      perPage: params.perPage,
      ids: params.ids,
      excludeIds: params.excludeIds,
    });
  },

  async cpCarsMain(
    _root,
    params: CpCarsFilter,
    { subdomain, commonQuerySelector = {}, models, cpUser }: IContext,
  ) {
    const filter = await generateClientPortalCarsFilter(
      subdomain,
      commonQuerySelector,
      params,
      cpUser,
    );

    return {
      list: await paginate(models.Cars.find(filter).sort(buildSort(params)), {
        page: params.page,
        perPage: params.perPage,
        ids: params.ids,
        excludeIds: params.excludeIds,
      }),
      totalCount: await models.Cars.countDocuments(filter),
    };
  },

  async cpCarDetail(
    _root,
    {
      _id,
      customerId,
      companyId,
    }: { _id: string; customerId?: string; companyId?: string },
    { models, subdomain, cpUser }: IContext,
  ) {
    const entityIds = resolveClientPortalEntityIds(cpUser, {
      customerId,
      companyId,
    });
    await assertCanManageClientPortalCar(subdomain, _id, entityIds);

    return await models.Cars.getCar(_id);
  },

  async cpCarCategories(
    _root,
    params: { parentId?: string; searchValue?: string },
    { commonQuerySelector = {}, models }: IContext,
  ) {
    return await models.CarCategories.find(
      generateCategoryFilter(commonQuerySelector, params),
    )
      .sort({ order: 1 })
      .lean();
  },

  async cpCarCategoriesTotalCount(
    _root,
    _params,
    { commonQuerySelector = {}, models }: IContext,
  ) {
    return await models.CarCategories.countDocuments(commonQuerySelector);
  },

  async cpCarCategoryDetail(
    _root,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    return await models.CarCategories.findOne({ _id });
  },

  async carPlateSuffixes(
    _root,
    _params,
    { models, checkPermission }: IContext,
  ) {
    await checkPermission('showCars');

    const pipeline = [
      {
        $match: {
          ...getActiveCarsSelector(),
          plateNumber: { $type: 'string' },
        },
      },
      {
        $project: {
          plateSuffix: {
            $cond: [
              { $gte: [{ $strLenCP: '$plateNumber' }, 3] },
              {
                $substrCP: [
                  '$plateNumber',
                  { $subtract: [{ $strLenCP: '$plateNumber' }, 3] },
                  3,
                ],
              },
              null,
            ],
          },
        },
      },
      {
        $match: {
          plateSuffix: { $regex: /^[А-Я]{3}$/ },
        },
      },
      {
        $group: {
          _id: null,
          uniquePlateSuffixes: { $addToSet: '$plateSuffix' },
        },
      },
      {
        $project: {
          _id: 0,
          uniquePlateSuffixes: 1,
        },
      },
    ];

    const [result] = await models.Cars.aggregate(pipeline);

    return result?.uniquePlateSuffixes || [];
  },
};

carQueries.cpCars.wrapperConfig = {
  forClientPortal: true,
  cpUserRequired: true,
};
carQueries.cpCarsMain.wrapperConfig = {
  forClientPortal: true,
  cpUserRequired: true,
};
carQueries.cpCarDetail.wrapperConfig = {
  forClientPortal: true,
  cpUserRequired: true,
};
carQueries.cpCarCategories.wrapperConfig = { forClientPortal: true };
carQueries.cpCarCategoriesTotalCount.wrapperConfig = { forClientPortal: true };
carQueries.cpCarCategoryDetail.wrapperConfig = { forClientPortal: true };
