import { cursorPaginateAggregation } from 'erxes-api-shared/utils';
import { Types } from 'mongoose';
import { IContractPaymentDocument } from '@/contract/@types/payment';
import { IContext } from '~/connectionResolvers';

const paymentSortPipeline = (matchStage: Record<string, any>) => [
  { $match: matchStage },
  {
    $addFields: {
      _sortPriority: {
        $switch: {
          branches: [
            { case: { $eq: ['$status', 'paid'] }, then: 2 },
            {
              case: {
                $and: [
                  { $ne: ['$status', 'paid'] },
                  { $lt: ['$dueDate', new Date()] },
                ],
              },
              then: 0,
            },
          ],
          default: 1,
        },
      },
    },
  },
];

export const contractPaymentQueries = {
  blockGetContractPayments: async (
    _parent: undefined,
    {
      contractId,
      limit,
      cursor,
      direction,
    }: {
      contractId: string;
      limit?: number;
      cursor?: string;
      direction?: 'forward' | 'backward';
    },
    { models }: IContext,
  ) => {
    return cursorPaginateAggregation<IContractPaymentDocument>({
      model: models.ContractPayment as any,
      pipeline: paymentSortPipeline({ contractId: new Types.ObjectId(contractId) }),
      params: {
        limit: limit ?? 30,
        cursor,
        direction: direction ?? 'forward',
        orderBy: { _sortPriority: 1, dueDate: 1 } as any,
      },
    });
  },

  blockGetProjectPayments: async (
    _parent: undefined,
    {
      projectId,
      paid,
      contractNumber,
      customerId,
      unitNumber,
      limit,
      cursor,
      direction,
    }: {
      projectId: string;
      paid?: boolean;
      contractNumber?: string;
      customerId?: string;
      unitNumber?: string;
      limit?: number;
      cursor?: string;
      direction?: 'forward' | 'backward';
    },
    { models }: IContext,
  ) => {
    const match: Record<string, any> = { projectId: projectId.toString() };
    if (typeof paid === 'boolean') {
      match.status = paid ? 'paid' : { $in: ['unpaid', 'partial'] };
    }
    if (contractNumber) {
      match.contractNumber = { $regex: contractNumber, $options: 'i' };
    }
    if (customerId) {
      match.partyId = customerId;
      match.partyType = 'customer';
    }
    if (unitNumber) {
      const matchedUnits = await models.Unit.find(
        { number: { $regex: unitNumber, $options: 'i' } },
        { _id: 1 },
      ).lean();
      match.unit = { $in: matchedUnits.map((u: any) => u._id) };
    }

    return cursorPaginateAggregation<IContractPaymentDocument>({
      model: models.ContractPayment as any,
      pipeline: paymentSortPipeline(match),
      params: {
        limit: limit ?? 10,
        cursor,
        direction: direction ?? 'forward',
        orderBy: { _sortPriority: 1, dueDate: 1 } as any,
      },
    });
  },

  blockGetProjectPaymentPlanData: async (
    _parent: undefined,
    { projectId }: { projectId: string },
    { models }: IContext,
  ) => {
    const buildings = await models.Building.find(
      { project: projectId },
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

    const signedStages = await models.ContractStatus.find(
      { type: 'signed' },
      { _id: 1 },
    ).lean();
    if (!signedStages.length) return [];
    const signedStageIds = signedStages.map((s: any) => s._id);

    const contracts = await models.Contract.find(
      { unit: { $in: unitIds }, status: { $in: signedStageIds } },
      { _id: 1 },
    ).lean();
    if (!contracts.length) return [];

    const contractIds = contracts.map((c: any) => c._id);
    return models.ContractPayment.find({ contractId: { $in: contractIds } })
      .sort({ dueDate: 1 })
      .lean();
  },

  blockGetUnitPaymentPlanData: async (
    _parent: undefined,
    { unitId }: { unitId: string },
    { models }: IContext,
  ) => {
    const signedStages = await models.ContractStatus.find({ type: 'signed' }, { _id: 1 }).lean();
    if (!signedStages.length) return [];
    const signedStageIds = signedStages.map((s: any) => s._id);
    const contracts = await models.Contract.find(
      { unit: new Types.ObjectId(unitId), status: { $in: signedStageIds } },
      { _id: 1 },
    ).lean();
    if (!contracts.length) return [];
    const contractIds = contracts.map((c: any) => c._id);
    return models.ContractPayment.find({ contractId: { $in: contractIds } })
      .sort({ dueDate: 1 })
      .lean();
  },

  blockGetUnitPaymentTransactions: async (
    _parent: undefined,
    { unitId }: { unitId: string },
    { models }: IContext,
  ) => {
    const signedStages = await models.ContractStatus.find({ type: 'signed' }, { _id: 1 }).lean();
    if (!signedStages.length) return [];
    const signedStageIds = signedStages.map((s: any) => s._id);
    const contracts = await models.Contract.find(
      { unit: new Types.ObjectId(unitId), status: { $in: signedStageIds } },
      { _id: 1 },
    ).lean();
    if (!contracts.length) return [];
    const contractIds = contracts.map((c: any) => c._id.toString());
    return models.ContractPaymentTransaction.find({ contractId: { $in: contractIds } })
      .sort({ date: -1 })
      .lean();
  },

  blockGetProjectPaymentTransactions: async (
    _parent: undefined,
    { projectId }: { projectId: string },
    { models }: IContext,
  ) => {
    const buildings = await models.Building.find({ project: projectId }, { _id: 1 }).lean();
    const buildingIds = buildings.map((b: any) => b._id);
    const zonings = await models.Zoning.find({ building: { $in: buildingIds } }, { _id: 1 }).lean();
    const zoningIds = zonings.map((z: any) => z._id);
    const units = await models.Unit.find({ zoning: { $in: zoningIds } }, { _id: 1 }).lean();
    const unitIds = units.map((u: any) => u._id);
    const signedStages = await models.ContractStatus.find({ type: 'signed' }, { _id: 1 }).lean();
    if (!signedStages.length) return [];
    const signedStageIds = signedStages.map((s: any) => s._id);
    const contracts = await models.Contract.find(
      { unit: { $in: unitIds }, status: { $in: signedStageIds } },
      { _id: 1 },
    ).lean();
    if (!contracts.length) return [];
    const contractIds = contracts.map((c: any) => c._id.toString());
    return models.ContractPaymentTransaction.find({ contractId: { $in: contractIds } })
      .sort({ date: -1 })
      .lean();
  },

  blockGetPaymentTransactions: async (
    _parent: undefined,
    { paymentId }: { paymentId: string },
    { models }: IContext,
  ) => {
    return models.ContractPaymentTransaction.find({ paymentId }).sort({
      date: -1,
    });
  },
};
