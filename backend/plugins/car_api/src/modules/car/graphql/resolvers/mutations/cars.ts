import type { Resolver } from 'erxes-api-shared/core-types';
import { IContext } from '~/connectionResolvers';
import { ICar, ICarDocument, ICarCategory } from '~/modules/car/@types/car';
import {
  CORE_COMPANY_CONTENT_TYPE,
  CORE_CUSTOMER_CONTENT_TYPE,
} from '~/modules/car/constants';
import {
  assertCanManageClientPortalCar,
  ensureCarEntityRelation,
  removeCarEntityRelations,
  resolveClientPortalEntityIds,
} from '~/modules/car/clientPortal';

type CarResolver = Resolver<any, any, IContext>;

export const carMutations: Record<string, CarResolver> = {
  async carsAdd(
    _root,
    doc: ICar,
    { models, user, __, checkPermission }: IContext,
  ) {
    await checkPermission('manageCars');

    return await models.Cars.createCar(__(doc), user);
  },

  async carsEdit(
    _root,
    { _id, ...doc }: { _id: string } & ICar,
    { models, __, checkPermission }: IContext,
  ) {
    await checkPermission('manageCars');

    return await models.Cars.updateCar(_id, __(doc));
  },

  async carsRemove(
    _root,
    { carIds = [] }: { carIds: string[] },
    { models, checkPermission }: IContext,
  ) {
    await checkPermission('manageCars');

    await models.Cars.removeCars(carIds);

    return carIds;
  },

  async carsMerge(
    _root,
    {
      carIds = [],
      carFields = {},
    }: { carIds: string[]; carFields: Partial<ICar> },
    { models, checkPermission }: IContext,
  ) {
    await checkPermission('manageCars');

    return await models.Cars.mergeCars(carIds, carFields);
  },

  async carCategoriesAdd(
    _root,
    doc: ICarCategory,
    { models, __, checkPermission }: IContext,
  ) {
    await checkPermission('manageCars');

    return await models.CarCategories.createCarCategory(__(doc));
  },

  async carCategoriesEdit(
    _root,
    { _id, ...doc }: { _id: string } & Partial<ICarCategory>,
    { models, __, checkPermission }: IContext,
  ) {
    await checkPermission('manageCars');

    return await models.CarCategories.updateCarCategory(_id, __(doc));
  },

  async carCategoriesRemove(
    _root,
    { _id }: { _id: string },
    { models, checkPermission }: IContext,
  ) {
    await checkPermission('manageCars');

    return await models.CarCategories.removeCarCategory(_id);
  },

  async cpCarsAdd(
    _root,
    {
      customerId,
      companyId,
      ...doc
    }: ICar & { customerId?: string; companyId?: string },
    { models, subdomain, user, cpUser, __ }: IContext,
  ) {
    const entityIds = resolveClientPortalEntityIds(cpUser, {
      customerId,
      companyId,
    });
    const carsOrFilter: Record<string, any>[] = [];

    if (doc.plateNumber) {
      carsOrFilter.push({ plateNumber: doc.plateNumber });
    }

    if (doc.vinNumber) {
      carsOrFilter.push({ vinNumber: doc.vinNumber });
    }

    if (!carsOrFilter.length) {
      throw new Error('Cant create, must fill plateNumber or vinNumber');
    }

    const existingCar = await models.Cars.findOne({
      status: { $ne: 'Deleted' },
      $or: carsOrFilter,
    }).lean();

    // Legacy client portal add is an upsert by plate/VIN before linking the portal entity.
    const car = existingCar
      ? await models.Cars.updateCar(existingCar._id, __(doc))
      : await models.Cars.createCar(__(doc), user);

    await ensureCarEntityRelation(
      subdomain,
      car._id,
      CORE_CUSTOMER_CONTENT_TYPE,
      entityIds.customerId,
    );

    await ensureCarEntityRelation(
      subdomain,
      car._id,
      CORE_COMPANY_CONTENT_TYPE,
      entityIds.companyId,
    );

    return car;
  },

  async cpCarsEdit(
    _root,
    {
      _id,
      customerId,
      companyId,
      ...doc
    }: ICarDocument & { customerId?: string; companyId?: string },
    { models, subdomain, cpUser, __ }: IContext,
  ) {
    const entityIds = resolveClientPortalEntityIds(cpUser, {
      customerId,
      companyId,
    });
    const car = await models.Cars.getCar(_id);
    await assertCanManageClientPortalCar(subdomain, car._id, entityIds);

    return await models.Cars.updateCar(_id, __(doc));
  },

  async cpCarsRemove(
    _root,
    {
      carIds = [],
      customerId,
      companyId,
    }: { carIds: string[]; customerId?: string; companyId?: string },
    { subdomain, cpUser }: IContext,
  ) {
    const entityIds = resolveClientPortalEntityIds(cpUser, {
      customerId,
      companyId,
    });

    for (const carId of carIds) {
      await assertCanManageClientPortalCar(subdomain, carId, entityIds);
    }

    await removeCarEntityRelations(
      subdomain,
      carIds,
      CORE_CUSTOMER_CONTENT_TYPE,
      entityIds.customerId,
    );

    await removeCarEntityRelations(
      subdomain,
      carIds,
      CORE_COMPANY_CONTENT_TYPE,
      entityIds.companyId,
    );

    return carIds;
  },
};

carMutations.cpCarsAdd.wrapperConfig = {
  forClientPortal: true,
  cpUserRequired: true,
};
carMutations.cpCarsEdit.wrapperConfig = {
  forClientPortal: true,
  cpUserRequired: true,
};
carMutations.cpCarsRemove.wrapperConfig = {
  forClientPortal: true,
  cpUserRequired: true,
};
