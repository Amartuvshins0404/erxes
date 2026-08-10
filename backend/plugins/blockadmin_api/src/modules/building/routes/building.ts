import { Router } from 'express';
import { IContext } from '~/connectionResolvers';
import { IRequest, IResponse } from '~/types';
import { IBuilding } from '../@types/building';

const router: Router = Router();

router.post(
  '/blockCreateBuilding',
  async (req: IRequest<IBuilding>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { input } = data || {};

      const project = await models.Project.getProject(subdomain, input.project);

      await models.Building.createBuilding({
        ...input,
        subdomain,
        entityId,
        project: project._id,
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
  '/blockUpdateBuilding',
  async (req: IRequest<IBuilding>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { input } = data || {};

      const building = await models.Building.getBuilding(subdomain, entityId);

      await models.Building.updateBuilding(subdomain, entityId, {
        ...input,
        project: building.project,
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
  '/blockDeleteBuilding',
  async (req: IRequest<IBuilding>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId } = payload || {};

      await models.Building.deleteBuilding(subdomain, entityId);

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
  '/blockDupplicateBuilding',
  async (req: IRequest<{}, { buildingId: string }>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { buildingId } = data || {};

      const building = await models.Building.getBuilding(subdomain, buildingId);

      const { _id, ...rest } = building;

      await models.Building.createBuilding({
        ...rest,
        name: `${rest.name} duplicated`,
        subdomain,
        entityId,
        project: building.project,
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

export { router };
