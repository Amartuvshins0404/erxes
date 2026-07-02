import { cursorPaginateAggregation } from 'erxes-api-shared/utils';
import { IContractDocument } from '@/contract/@types/contract';
import { IContext } from '~/connectionResolvers';
import { Types } from 'mongoose';

const STATUS_TYPE_ORDER = ['reserved', 'draft', 'lost', 'cancelled', 'signed'];

export interface IContractFilter {
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

export const contractQueries = {
  blockGetContract: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.Contract.getContract(_id);
  },

  blockGetContracts: async (
    _parent: undefined,
    { unit }: { unit?: string },
    { models }: IContext,
  ) => {
    return models.Contract.find(unit ? { unit } : {});
  },

  blockGetUnitContractOverview: async (
    _parent: undefined,
    { unitId }: { unitId: string },
    { models }: IContext,
  ) => {
    const contracts = await models.Contract.find({ unit: new Types.ObjectId(unitId) }, { status: 1 }).lean();
    if (!contracts.length) return { total: 0, stages: [] };
    const stageIdStrs = contracts.map((c: any) => c.status?.toString()).filter(Boolean);
    const uniqueStageIds = [...new Set(stageIdStrs)];
    const statuses = await models.ContractStatus.find(
      { _id: { $in: uniqueStageIds } },
      { _id: 1, name: 1, order: 1 },
    ).lean();
    const nameById = new Map(statuses.map((s: any) => [s._id.toString(), s.name || 'Unknown']));
    const countByStage = new Map<string, number>();
    for (const c of contracts) {
      const name = c.status ? (nameById.get(c.status.toString()) ?? 'Unknown') : 'Unknown';
      countByStage.set(name, (countByStage.get(name) ?? 0) + 1);
    }
    const stageOrder = new Map<string, number>();
    for (const s of statuses) {
      stageOrder.set(s.name || 'Unknown', s.order ?? 9999);
    }
    const stages = [...countByStage.entries()]
      .sort((a, b) => (stageOrder.get(a[0]) ?? 9999) - (stageOrder.get(b[0]) ?? 9999))
      .map(([name, count]) => ({ name, count }));
    return { total: contracts.length, stages };
  },

  blockGetContractsList: async (
    _parent: undefined,
    {
      filter,
      limit,
      cursor,
      direction,
    }: {
      filter?: IContractFilter;
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
        if (filter.dateFrom) {
          query.date.$gte = new Date(filter.dateFrom);
        }
        if (filter.dateTo) {
          query.date.$lte = new Date(filter.dateTo);
        }
      }
    }

    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'block_contract_statuses',
          localField: 'status',
          foreignField: '_id',
          as: '_statusDoc',
        },
      },
      {
        $addFields: {
          _statusType: { $arrayElemAt: ['$_statusDoc.type', 0] },
          _statusOrder: { $arrayElemAt: ['$_statusDoc.order', 0] },
          _statusPriority: {
            $switch: {
              branches: STATUS_TYPE_ORDER.map((type, i) => ({
                case: { $eq: [{ $arrayElemAt: ['$_statusDoc.type', 0] }, type] },
                then: i,
              })),
              default: STATUS_TYPE_ORDER.length,
            },
          },
        },
      },
    ];

    return cursorPaginateAggregation<IContractDocument>({
      model: models.Contract as any,
      pipeline,
      params: {
        limit: limit ?? 30,
        cursor,
        direction: direction ?? 'forward',
        orderBy: { _statusPriority: 1, _statusOrder: 1, createdAt: -1 } as any,
      },
    });
  },
};
