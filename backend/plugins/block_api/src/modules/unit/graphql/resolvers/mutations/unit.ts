import { CONTRACT_STATUS } from '@/contract/constants';
import { IUnit, IUnitInput, ITransferUnit } from '@/unit/@types/unit';
import { DeleteResult } from 'mongoose';
import { IContext } from '~/connectionResolvers';

export const unitMutations = {
  blockCreateUnit: async (
    _parent: undefined,
    { input }: { input: IUnitInput },
    { models }: IContext,
  ) => {
    const { useProjectPrice, ...rest } = input;

    if (useProjectPrice) {
      const zoning = await models.Zoning.findOne({ _id: input.zoning });
      if (!zoning) {
        throw new Error('Zoning not found');
      }
      const building = await models.Building.findOne({ _id: zoning.building });
      if (!building) {
        throw new Error('Building not found');
      }
      const project = await models.Project.findOne({ _id: building.project });
      if (!project) {
        throw new Error('Project not found');
      }
    }

    return models.Unit.createUnit(rest);
  },

  blockCreateUnits: async (
    _parent: undefined,
    {
      input,
    }: { input: { units: string[]; zoneRange: number[]; buildingId: string } },
    { models }: IContext,
  ) => {
    const { units, zoneRange, buildingId } = input;

    const documents: IUnit[] = [];

    const [start, end] = zoneRange;

    if (start > end) {
      throw new Error('Invalid zone range');
    }

    if (units?.length) {
      for (let i = 0; i < units.length; i++) {
        const unitType = units[i];

        for (let f = start; f <= end; f++) {
          const zone = await models.Zoning.findOne({
            floor: f,
            building: buildingId,
          }).lean();

          if (!zone) continue;

          const document: IUnit = {
            zoning: zone._id,
            type: unitType,
            number: '',
          };

          document['number'] = `${
            zone.floor < 0 ? `B${zone.floor * -1}` : zone.floor
          }${i + 1 < 10 ? `0${i + 1}` : i + 1}`;

          documents.push(document);
        }
      }
    }

    return {
      response: await models.Unit.insertMany(documents),
      options: {
        fields: ['zoning', 'number', 'type'],
      },
    };
  },

  blockUpdateUnit: async (
    _parent: undefined,
    { _id, input }: { _id: string; input: IUnitInput },
    { models, user }: IContext,
  ) => {
    const { useProjectPrice, ...rest } = input;

    const unit = await models.Unit.getUnit(_id);

    if (!unit) {
      throw new Error('Unit not found');
    }

    const signedStatus = await models.ContractStatus.findOne({ type: CONTRACT_STATUS.SIGNED });
    const contract = signedStatus
      ? await models.Contract.findOne({ unit: _id, status: signedStatus._id })
      : null;

    if (contract) {
      throw new Error('Can not update unit because contract is signed');
    }

    if (useProjectPrice) {
      const zoning = await models.Zoning.findOne({ _id: input.zoning });
      if (!zoning) {
        throw new Error('Zoning not found');
      }
      const building = await models.Building.findOne({ _id: zoning.building });
      if (!building) {
        throw new Error('Building not found');
      }
      const project = await models.Project.findOne({ _id: building.project });
      if (!project) {
        throw new Error('Project not found');
      }
    }

    return models.Unit.updateUnit(_id, rest, user?._id || '');
  },

  blockRemoveUnit: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.Unit.removeUnit(_id);
  },

  blockRemoveUnits: async (
    _parent: undefined,
    { _ids }: { _ids: string[] },
    { models }: IContext,
  ): Promise<DeleteResult> => {
    return models.Unit.deleteMany({ _id: { $in: _ids } });
  },

  blockTransferUnit: async (
    _parent: undefined,
    { input }: { input: ITransferUnit },
    { models }: IContext,
  ) => {
    return models.Unit.transferUnit(input);
  },

  blockToggleUnitLock: async (
    _parent: undefined,
    { _id, locked }: { _id: string; locked: boolean },
    { models }: IContext,
  ) => {
    const unit = await models.Unit.findOne({ _id });
    if (!unit) {
      throw new Error('Unit not found');
    }
    return models.Unit.findOneAndUpdate(
      { _id },
      { $set: { locked } },
      { new: true },
    );
  },
};
