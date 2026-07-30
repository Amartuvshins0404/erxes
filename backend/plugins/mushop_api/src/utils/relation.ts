import { sendTRPCMessage } from 'erxes-api-shared/utils';

export interface IRelationEntity {
  contentType: string;
  contentId: string;
}

interface IRelation {
  _id: string;
  entities?: IRelationEntity[];
}

const isSame = (a: IRelationEntity, b: IRelationEntity): boolean =>
  a.contentType === b.contentType && a.contentId === b.contentId;

const has = (list: IRelationEntity[], item: IRelationEntity): boolean =>
  list.some((e) => isSame(e, item));

export const getRelationsByEntity = async (
  subdomain: string,
  entity: IRelationEntity,
): Promise<IRelation[]> =>
  (await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'query',
    module: 'relation',
    action: 'getRelationsByEntities',
    input: {
      contentType: entity.contentType,
      contentId: entity.contentId,
    },
  })) ?? [];

export const linkRelation = async ({
  subdomain,
  main,
  related,
}: {
  subdomain: string;
  main: IRelationEntity;
  related: IRelationEntity[];
}): Promise<void> => {
  const existing = await getRelationsByEntity(subdomain, main);

  const missing = related.filter(
    (entity) =>
      !isSame(entity, main) &&
      !existing.some(
        (rel) => has(rel.entities ?? [], main) && has(rel.entities ?? [], entity),
      ),
  );

  if (!missing.length) {
    return;
  }

  await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'mutation',
    module: 'relation',
    action: 'createMultipleRelations',
    input: {
      relations: missing.map((entity) => ({ entities: [main, entity] })),
    },
  });
};
