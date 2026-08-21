import { Resolver } from 'erxes-api-shared/core-types';
import { escapeRegExp, markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';

interface ITravelAssociationListParams {
  searchValue?: string;
  foundDateFrom?: Date;
  foundDateTo?: Date;
}

const buildTravelAssociationFilter = (
  params: ITravelAssociationListParams,
) => {
  const filter: Record<string, unknown> = {};

  if (params.foundDateFrom || params.foundDateTo) {
    filter.foundDate = {};

    if (params.foundDateFrom) {
      (filter.foundDate as Record<string, Date>).$gte = new Date(
        params.foundDateFrom,
      );
    }

    if (params.foundDateTo) {
      (filter.foundDate as Record<string, Date>).$lte = new Date(
        params.foundDateTo,
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
    ];
  }

  return filter;
};

export const travelAssociationQueries: Record<string, Resolver> = {
  async mtoTravelAssociations(
    _root: undefined,
    params: ITravelAssociationListParams,
    { models }: IContext,
  ) {
    const filter = buildTravelAssociationFilter(params);

    return models.TravelAssociation.find(filter).sort({ foundDate: -1 });
  },

  async mtoTravelAssociation(
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    return models.TravelAssociation.findOne({ _id });
  },
};

markResolvers(travelAssociationQueries, {
  wrapperConfig: {
    skipPermission: true,
  },
});
