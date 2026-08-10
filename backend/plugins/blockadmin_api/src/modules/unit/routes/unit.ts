import { Router, Request } from 'express';
import { IContext } from '~/connectionResolvers';
import { IRequest, IResponse } from '~/types';
import { IUnit, ITransferUnitPayload } from '../@types/unit';

const router: Router = Router();

router.post(
  '/blockCreateUnit',
  async (req: IRequest<IUnit>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { input } = data || {};

      const zoning = await models.Zoning.getBuildingZoning(
        subdomain,
        input.zoning,
      );

      if (input?.type) {
        const unitType = await models.UnitType.getUnitType(
          subdomain,
          input.type,
        );

        input['type'] = unitType._id;
      }

      await models.Unit.createUnit({
        ...input,
        subdomain,
        entityId,
        zoning: zoning._id,
      });

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  },
);

router.post('/blockCreateUnits', async (req: Request, res: IResponse) => {
  const { models } = res.locals as IContext;

  try {
    const { subdomain, payload } = req.body || {};

    const { entities, data } = payload || {};

    const { input } = data || {};

    const documents: IUnit[] = [];

    for (const entityKey in entities) {
      const { zoning, number, type } = entities[entityKey];

      const zone = await models.Zoning.getBuildingZoning(subdomain, zoning);
      const unitType = await models.UnitType.getUnitType(subdomain, type);

      const document: IUnit = {
        ...input,
        number,
        zoning: zone._id,
        type: unitType._id,
        subdomain,
        entityId: entityKey,
      };
      documents.push(document);
    }

    await models.Unit.insertMany(documents);

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
});

router.post(
  '/blockUpdateUnit',
  async (req: IRequest<IUnit>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { input } = data || {};

      if (input?.type) {
        const unitType = await models.UnitType.getUnitType(
          subdomain,
          input.type,
        );

        input['type'] = unitType._id;
      }

      await models.Unit.updateUnit(subdomain, entityId, {
        ...input,
      });

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  },
);

router.post(
  '/blockRemoveUnit',
  async (req: IRequest<IUnit>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId } = payload || {};

      await models.Unit.removeUnit(subdomain, entityId);

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  },
);

router.post(
  '/blockRemoveUnits',
  async (req: IRequest<IUnit, { _ids: string[] }>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { data } = payload || {};

      const { _ids } = data || {};

      const unitIds = await models.Unit.find({
        subdomain,
        entityId: { $in: _ids },
      }).distinct('_id');

      models.Unit.deleteMany({ _id: { $in: unitIds } }).catch((error) =>
        console.error('[blockRemoveUnits] Delete failed:', error.message),
      );

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  },
);

router.post(
  '/blockToggleUnitLock',
  async (
    req: IRequest<IUnit, { locked: boolean }>,
    res: IResponse,
  ) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { locked } = data || {};

      const unit = await models.Unit.getUnit(subdomain, entityId);

      await models.Unit.updateUnit(subdomain, entityId, { ...unit, locked });

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  },
);

router.post(
  '/blockTransferUnit',
  async (req: IRequest<ITransferUnitPayload>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};
      const { entityId, data } = payload || {};
      const { input } = data || {};

      const updated = await models.Unit.transferUnit({
        blockSubdomain: subdomain,
        unitId: entityId,
        agencySubdomain: input.agencySubdomain,
        agencyId: input.agencyEntityId,
      });

      return res.status(200).json({ success: true, unit: updated });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

export { router };
