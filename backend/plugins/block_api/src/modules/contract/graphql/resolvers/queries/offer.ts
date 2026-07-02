import { cursorPaginateAggregation } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { Types } from 'mongoose';

export interface IOfferFilter {
  projectId?: string;
  unit?: string;
  search?: string;
  status?: string;
  partyType?: string;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
  user?: string;
}

export const offerQueries = {
  blockGetOffer: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.Offer.getOffer(_id);
  },

  blockGetUnitOfferStats: async (
    _parent: undefined,
    { unitId }: { unitId: string },
    { models }: IContext,
  ) => {
    const result = await models.Offer.aggregate([
      { $match: { unit: new Types.ObjectId(unitId) } },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          sentCount: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          draftCount: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          averageAmount: { $avg: '$amount' },
          highestAmount: { $max: '$amount' },
          lowestAmount: { $min: '$amount' },
          currency: { $first: '$currency' },
        },
      },
    ]);
    if (!result.length) return { totalCount: 0, sentCount: 0, draftCount: 0, averageAmount: null, highestAmount: null, lowestAmount: null, currency: null };
    const r = result[0];
    return {
      totalCount: r.totalCount,
      sentCount: r.sentCount,
      draftCount: r.draftCount,
      averageAmount: r.averageAmount,
      highestAmount: r.highestAmount,
      lowestAmount: r.lowestAmount,
      currency: r.currency,
    };
  },

  blockGetOffers: async (
    _parent: undefined,
    { unit, project }: { unit?: string; project?: string },
    { models }: IContext,
  ) => {
    if (project) return models.Offer.find({ project });
    return models.Offer.find(unit ? { unit } : {});
  },

  blockGetOffersList: async (
    _parent: undefined,
    {
      filter,
      limit,
      cursor,
      direction,
    }: {
      filter?: IOfferFilter;
      limit?: number;
      cursor?: string;
      direction?: 'forward' | 'backward';
    },
    { models }: IContext,
  ) => {
    const query: Record<string, any> = {};

    if (filter) {
      if (filter.projectId) {
        const buildings = await models.Building.find(
          { project: filter.projectId },
          { _id: 1 },
        ).lean();
        const buildingIds = buildings.map((b: any) => b._id);

        const zonings = await models.Zoning.find(
          { building: { $in: buildingIds } },
          { _id: 1 },
        ).lean();
        const zoningIds = zonings.map((z: any) => z._id);

        const units = await models.Unit.find(
          { zoning: { $in: zoningIds } },
          { _id: 1 },
        ).lean();
        const unitIds = units.map((u: any) => u._id);

        query.unit = { $in: unitIds };
      }
      if (filter.unit) {
        query.unit = new Types.ObjectId(filter.unit);
      }
      if (filter.search) {
        query.number = { $regex: filter.search, $options: 'i' };
      }
      if (filter.status) {
        query.status = filter.status;
      }
      if (filter.partyType) {
        query['party.type'] = filter.partyType;
      }
      if (filter.currency) {
        query.currency = filter.currency;
      }
      if (filter.user) {
        query.user = filter.user;
      }
      if (filter.dateFrom || filter.dateTo) {
        query.date = {};
        if (filter.dateFrom) query.date.$gte = new Date(filter.dateFrom);
        if (filter.dateTo) query.date.$lte = new Date(filter.dateTo);
      }
    }

    const pipeline = [{ $match: query }];

    return cursorPaginateAggregation({
      model: models.Offer as any,
      pipeline,
      params: {
        limit: limit ?? 30,
        cursor,
        direction: direction ?? 'forward',
        orderBy: { createdAt: -1 } as any,
      },
    });
  },
};
