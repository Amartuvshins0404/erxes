import { sendTRPCMessage } from 'erxes-api-shared/utils';

const getPlacePathIds = async (
  subdomain: string,
  placeEntityId: string,
): Promise<string[]> => {
  const place: { order?: string } | null = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    module: 'structureEntities',
    action: 'findOne',
    input: { query: { _id: placeEntityId } },
    defaultValue: null,
  });

  return place?.order
    ? place.order.split('/').filter(Boolean)
    : [placeEntityId];
};

export const getPlacePaths = (
  subdomain: string,
  entityIds: Array<string | undefined>,
): Promise<string[][]> =>
  Promise.all(
    entityIds
      .filter((entityId): entityId is string => !!entityId)
      .map((entityId) => getPlacePathIds(subdomain, entityId)),
  );

export const getPlaceDepth = (
  placeEntityIds: string[] = [],
  placePaths: string[][] = [],
) =>
  Math.max(
    0,
    ...placePaths.map((pathIds) =>
      pathIds.reduce(
        (depth, placeId, index) =>
          placeEntityIds.includes(placeId) ? index : depth,
        0,
      ),
    ),
  );

export const getPlaceFilter = (placePaths: string[][] = []) => {
  const placePathIds = [...new Set(placePaths.flat())];

  return placePathIds.length
    ? {
        $or: [
          { placeEntityIds: { $in: placePathIds } },
          { 'placeEntityIds.0': { $exists: false } },
        ],
      }
    : { 'placeEntityIds.0': { $exists: false } };
};

export const getPlaceWithDescendantIds = async (
  subdomain: string,
  placeEntityId: string,
): Promise<string[]> => {
  const places: { _id: string }[] = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    module: 'structureEntities',
    action: 'findWithDescendants',
    input: { query: { _id: placeEntityId }, fields: { _id: 1 } },
    defaultValue: [],
  });

  return places.length ? places.map(({ _id }) => _id) : [placeEntityId];
};
