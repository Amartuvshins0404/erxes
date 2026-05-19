import { IUnitDocument } from '@/unit/@types/unit';
import { IContext } from '~/connectionResolvers';

const STAGE_PRIORITY: Record<string, number> = {
  signed: 4,
  reserved: 3,
  draft: 2,
};

export default {
  activeContract: async (
    unit: IUnitDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    if (!unit._id) return null;

    const contracts = await models.Contract.find({ unit: unit._id }).lean();
    if (!contracts.length) return null;

    const stageIds = Array.from(
      new Set(contracts.map((c) => c.status).filter(Boolean)),
    );
    const stages = await models.ContractStatus.find({
      _id: { $in: stageIds },
    }).lean();
    const stageById = new Map(stages.map((s: any) => [s._id.toString(), s]));

    let best: { contract: any; stage: any; score: number } | null = null;
    for (const c of contracts) {
      const stage = c.status ? stageById.get(c.status.toString()) : null;
      if (!stage) continue;
      if (stage.type === 'cancelled' || stage.type === 'lost') continue;
      const score = STAGE_PRIORITY[stage.type as string] ?? 1;
      if (!best || score > best.score) {
        best = { contract: c, stage, score };
      }
    }

    if (!best) return null;
    return {
      _id: best.contract._id.toString(),
      status: best.stage._id.toString(),
      statusType: best.stage.type || null,
      statusLabel: best.stage.name || null,
      statusColor: best.stage.color || null,
    };
  },

  unitType: async (
    unit: IUnitDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    if (!unit.type) return null;

    return await models.UnitType.findOne({ _id: unit.type });
  },

  zoningData: async (
    unit: IUnitDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    if (!unit.zoning) return null;

    return await models.Zoning.findOne({ _id: unit.zoning });
  },

  buildingData: async (
    unit: IUnitDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    if (!unit.zoning) return null;

    const zoning = await models.Zoning.findOne({ _id: unit.zoning });

    if (!zoning) {
      return null;
    }

    const building = await models.Building.findOne({ _id: zoning.building });

    return building;
  },

  projectData: async (
    unit: IUnitDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    if (!unit.zoning) return null;

    const zoning = await models.Zoning.findOne({ _id: unit.zoning });

    if (!zoning) {
      return null;
    }

    const building = await models.Building.findOne({ _id: zoning.building });

    if (!building) {
      return null;
    }

    const project = await models.Project.findOne({ _id: building.project });

    return project;
  },
};
