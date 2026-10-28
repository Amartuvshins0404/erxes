import { sendTRPCMessage } from 'erxes-api-shared/utils';

export type TStructureEntityLookup = {
  _id: string;
  code?: string;
  title?: string;
};

export const getEntityIdsWithDescendants = async (
  subdomain: string,
  ids: string[],
): Promise<string[]> => {
  if (!ids.length) {
    return [];
  }

  const entities: TStructureEntityLookup[] = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'query',
    module: 'structureEntities',
    action: 'findWithDescendants',
    input: {
      query: { _id: { $in: ids } },
      fields: { _id: 1 },
    },
    defaultValue: [],
  });

  return entities.map((entity) => entity._id);
};

export const findStructureEntities = async (
  subdomain: string,
  query: Record<string, unknown>,
): Promise<TStructureEntityLookup[]> =>
  sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'query',
    module: 'structureEntities',
    action: 'find',
    input: { query, fields: { _id: 1, code: 1, title: 1 } },
    defaultValue: [],
  });
