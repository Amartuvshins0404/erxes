import DataLoader from 'dataloader';
import { IModels } from '~/connectionResolvers';
import {
  CAR_RELATION_CONTENT_TYPES,
  CORE_COMPANY_CONTENT_TYPE,
  CORE_CUSTOMER_CONTENT_TYPE,
} from '~/modules/car/constants';
import { requireArrayResult, requireCoreTRPC } from '~/modules/car/core';

export interface IRef {
  __typename: string;
  _id: string;
}

const buildRelationLoader = (
  subdomain: string,
  relatedContentType: string,
  typename: string,
) =>
  new DataLoader<string, IRef[]>(async (carIds) => {
    const relationResults = await Promise.all(
      CAR_RELATION_CONTENT_TYPES.map(async (contentType) =>
        requireArrayResult<any>(
          await requireCoreTRPC({
            subdomain,
            module: 'relation',
            action: 'filterRelations',
            input: {
              contentType,
              contentIds: carIds,
              relatedContentType,
            },
          }),
          `Core relation.filterRelations (${contentType})`,
        ),
      ),
    );

    const relations = relationResults.flat();
    const carContentTypes = new Set<string>(CAR_RELATION_CONTENT_TYPES);
    const refsByCarId: Record<string, Map<string, IRef>> = {};

    for (const relation of relations) {
      const carId =
        relation.entities?.find(
          (entity) => entity?.contentType && carContentTypes.has(entity.contentType),
        )?.contentId || '';
      const relatedId =
        relation.entities?.find(
          (entity) => entity.contentType === relatedContentType,
        )?.contentId || '';

      if (!refsByCarId[carId]) {
        refsByCarId[carId] = new Map();
      }

      if (relatedId) {
        refsByCarId[carId].set(`${typename}:${relatedId}`, {
          __typename: typename,
          _id: relatedId,
        });
      }
    }

    return carIds.map((carId) =>
      Array.from(refsByCarId[carId]?.values() || []),
    );
  });

export const carLoader = (subdomain: string, models: IModels) => ({
  customersByCarId: buildRelationLoader(
    subdomain,
    CORE_CUSTOMER_CONTENT_TYPE,
    'Customer',
  ),
  companiesByCarId: buildRelationLoader(
    subdomain,
    CORE_COMPANY_CONTENT_TYPE,
    'Company',
  ),
  categoryById: new DataLoader<string, any>(async (categoryIds) => {
    const categories = await models.CarCategories.find({
      _id: { $in: categoryIds },
    }).lean();

    const categoryById = Object.fromEntries(
      categories.map((category) => [category._id, category]),
    );

    return categoryIds.map((categoryId) => categoryById[categoryId] || null);
  }),
});
