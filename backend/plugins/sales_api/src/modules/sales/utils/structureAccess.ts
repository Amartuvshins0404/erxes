import {
  getContainerScopeFilter,
  getSharedWithFilter,
} from 'erxes-api-shared/core-modules';
import { IUserDocument } from 'erxes-api-shared/core-types';
import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { FilterQuery } from 'mongoose';
import { VISIBILITIES } from '~/modules/sales/constants';
import type { IModels } from '~/connectionResolvers';
import { IPipeline } from '~/modules/sales/@types';

export const DEAL_OWNER_FIELDS = ['userId', 'assignedUserIds'];

export const DEAL_ENTITY_FIELD = 'entityIds';

export const BOARD_MEMBER_FIELDS = ['userId'];

export const PIPELINE_MEMBER_FIELDS = ['memberIds', 'userId'];

export const STAGE_MEMBER_FIELDS = [
  'memberIds',
  'canMoveMemberIds',
  'canEditMemberIds',
];

export const getContainerAccessFilter = async (
  subdomain: string,
  user: IUserDocument,
  memberFields: string[],
): Promise<FilterQuery<unknown>> => {
  if (user.isOwner) {
    return {};
  }

  const sharedWith = await getSharedWithFilter(subdomain, user);

  return {
    $or: [
      ...memberFields.map((field) => ({ [field]: user._id })),
      {
        $and: [
          sharedWith,
          {
            $or: [
              { visibility: { $ne: VISIBILITIES.PRIVATE } },
              { 'sharedEntityIds.0': { $exists: true } },
            ],
          },
        ],
      },
    ],
  };
};

export const getBoardAccessFilter = (subdomain: string, user: IUserDocument) =>
  getContainerAccessFilter(subdomain, user, BOARD_MEMBER_FIELDS);

export const getPipelineAccessFilter = async (
  models: IModels,
  subdomain: string,
  user: IUserDocument,
): Promise<FilterQuery<unknown>> => {
  if (user.isOwner) {
    return {};
  }

  const [pipelineFilter, boardFilter] = await Promise.all([
    getContainerAccessFilter(subdomain, user, PIPELINE_MEMBER_FIELDS),
    getBoardAccessFilter(subdomain, user),
  ]);
  const boardIds = await models.Boards.distinct('_id', boardFilter);

  return { $and: [pipelineFilter, { boardId: { $in: boardIds } }] };
};

export const getPipelineDealFilter = (
  subdomain: string,
  user: IUserDocument,
  pipeline: Pick<IPipeline, 'accessRule'>,
): Promise<FilterQuery<unknown>> =>
  getContainerScopeFilter({
    subdomain,
    user,
    rule: pipeline.accessRule,
    ownerFields: DEAL_OWNER_FIELDS,
    entityField: DEAL_ENTITY_FIELD,
  });

export const getEntityIdsWithDescendants = async (
  subdomain: string,
  entityIds: string[],
): Promise<string[]> => {
  const entities: { _id: string }[] = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'query',
    module: 'structureEntities',
    action: 'findWithDescendants',
    input: { query: { _id: { $in: entityIds } }, fields: { _id: 1 } },
    defaultValue: [],
  });

  return entities.map(({ _id }) => _id);
};

export const keepHiddenEntityIds = async (
  subdomain: string,
  userId: string,
  previousIds: string[],
  nextIds: string[],
): Promise<string[]> => {
  if (!previousIds.length) {
    return nextIds;
  }

  const scope: { all?: boolean; entityIds?: string[] } | null =
    await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      method: 'query',
      module: 'permissions',
      action: 'resolveScope',
      input: {
        userId,
        plugin: 'core',
        module: 'organization',
        actions: ['structuresRead'],
      },
      defaultValue: null,
    });

  if (scope?.all) {
    return nextIds;
  }

  const visibleIds = scope?.entityIds || [];
  const hiddenIds = previousIds.filter((id) => !visibleIds.includes(id));

  return [...new Set([...nextIds, ...hiddenIds])];
};
