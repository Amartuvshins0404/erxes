import {
  CORE_COMPANY_CONTENT_TYPE,
  CORE_CUSTOMER_CONTENT_TYPE,
  ROOT_CAR_CONTENT_TYPE,
} from './constants';
import { requireArrayResult, requireCoreTRPC } from './core';

type ClientPortalUser = {
  _id?: string;
  erxesCustomerId?: string;
  erxesCompanyId?: string;
};

export type ClientPortalEntityInput = {
  customerId?: string;
  companyId?: string;
};

export const resolveClientPortalEntityIds = (
  cpUser: ClientPortalUser | undefined,
  { customerId, companyId }: ClientPortalEntityInput,
) => {
  if (!cpUser?._id) {
    throw new Error('Client portal user required');
  }

  if (customerId && customerId !== cpUser.erxesCustomerId) {
    throw new Error('Client portal customer mismatch');
  }

  if (companyId && companyId !== cpUser.erxesCompanyId) {
    throw new Error('Client portal company mismatch');
  }

  const hasRequestedEntity = !!customerId || !!companyId;
  const resolvedCustomerId =
    customerId || (!hasRequestedEntity ? cpUser.erxesCustomerId : undefined);
  const resolvedCompanyId =
    companyId || (!hasRequestedEntity ? cpUser.erxesCompanyId : undefined);

  if (!resolvedCustomerId && !resolvedCompanyId) {
    throw new Error(
      'Client portal user is not linked to a customer or company',
    );
  }

  return {
    customerId: resolvedCustomerId,
    companyId: resolvedCompanyId,
  };
};

export const ensureCarEntityRelation = async (
  subdomain: string,
  carId: string,
  relatedContentType: string,
  relatedContentId?: string,
) => {
  if (!relatedContentId) {
    return;
  }

  const existingIds = requireArrayResult<string>(
    await requireCoreTRPC({
      subdomain,
      module: 'relation',
      action: 'getRelationIds',
      input: {
        contentType: ROOT_CAR_CONTENT_TYPE,
        contentId: carId,
        relatedContentType,
      },
    }),
    'Core relation.getRelationIds',
  );

  if (existingIds.includes(relatedContentId)) {
    return;
  }

  return await requireCoreTRPC({
    subdomain,
    method: 'mutation',
    module: 'relation',
    action: 'createRelation',
    input: {
      relation: {
        entities: [
          {
            contentType: ROOT_CAR_CONTENT_TYPE,
            contentId: carId,
          },
          {
            contentType: relatedContentType,
            contentId: relatedContentId,
          },
        ],
      },
    },
  });
};

const hasCarEntityRelation = async (
  subdomain: string,
  carId: string,
  relatedContentType: string,
  relatedContentId?: string,
) => {
  if (!relatedContentId) {
    return false;
  }

  const existingIds = requireArrayResult<string>(
    await requireCoreTRPC({
      subdomain,
      module: 'relation',
      action: 'getRelationIds',
      input: {
        contentType: ROOT_CAR_CONTENT_TYPE,
        contentId: carId,
        relatedContentType,
      },
    }),
    'Core relation.getRelationIds',
  );

  return existingIds.includes(relatedContentId);
};

export const canManageClientPortalCar = async (
  subdomain: string,
  carId: string,
  { customerId, companyId }: ClientPortalEntityInput,
) => {
  const [matchesCustomer, matchesCompany] = await Promise.all([
    hasCarEntityRelation(
      subdomain,
      carId,
      CORE_CUSTOMER_CONTENT_TYPE,
      customerId,
    ),
    hasCarEntityRelation(
      subdomain,
      carId,
      CORE_COMPANY_CONTENT_TYPE,
      companyId,
    ),
  ]);

  return matchesCustomer || matchesCompany;
};

export const assertCanManageClientPortalCar = async (
  subdomain: string,
  carId: string,
  entityIds: ClientPortalEntityInput,
) => {
  if (!(await canManageClientPortalCar(subdomain, carId, entityIds))) {
    throw new Error('Cant access this car, not a customer or company car');
  }
};

const getRelatedCarIdsForEntity = async (
  subdomain: string,
  contentType: string,
  contentId?: string,
) => {
  if (!contentId) {
    return [];
  }

  return requireArrayResult<string>(
    await requireCoreTRPC({
      subdomain,
      module: 'relation',
      action: 'getRelationIds',
      input: {
        contentType,
        contentId,
        relatedContentType: ROOT_CAR_CONTENT_TYPE,
      },
    }),
    'Core relation.getRelationIds',
  );
};

export const getClientPortalCarIds = async (
  subdomain: string,
  { customerId, companyId }: ClientPortalEntityInput,
) => {
  const [customerCarIds, companyCarIds] = await Promise.all([
    getRelatedCarIdsForEntity(
      subdomain,
      CORE_CUSTOMER_CONTENT_TYPE,
      customerId,
    ),
    getRelatedCarIdsForEntity(
      subdomain,
      CORE_COMPANY_CONTENT_TYPE,
      companyId,
    ),
  ]);

  return Array.from(
    new Set([...customerCarIds, ...companyCarIds].filter(Boolean)),
  );
};

export const removeCarEntityRelations = async (
  subdomain: string,
  carIds: string[],
  relatedContentType: string,
  relatedContentId?: string,
) => {
  if (!relatedContentId || !carIds.length) {
    return;
  }

  const relations = requireArrayResult<any>(
    await requireCoreTRPC({
      subdomain,
      module: 'relation',
      action: 'filterRelations',
      input: {
        contentType: ROOT_CAR_CONTENT_TYPE,
        contentIds: carIds,
        relatedContentType,
      },
    }),
    'Core relation.filterRelations',
  );

  const targetRelationIds = relations
    .filter((relation) =>
      relation.entities?.some(
        (entity) =>
          entity.contentType === relatedContentType &&
          entity.contentId === relatedContentId,
      ),
    )
    .map((relation) => relation._id);

  for (const relationId of targetRelationIds) {
    await requireCoreTRPC({
      subdomain,
      method: 'mutation',
      module: 'relation',
      action: 'deleteRelation',
      input: { _id: relationId },
    });
  }
};
