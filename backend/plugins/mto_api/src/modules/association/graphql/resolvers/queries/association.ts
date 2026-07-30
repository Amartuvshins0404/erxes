import { Resolver } from 'erxes-api-shared/core-types';
import { markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';

export const associationQueries: Record<string, Resolver> = {
  async mtoAssociations(
    _root: undefined,
    {
      isActive,
      parentId,
      onlyTopLevel,
      level,
    }: {
      isActive?: boolean;
      parentId?: string;
      onlyTopLevel?: boolean;
      level?: string;
    },
    { models }: IContext,
  ) {
    const filter: Record<string, unknown> = {};

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (level) {
      filter.level = level;
    } else if (parentId !== undefined) {
      filter.parentId = parentId;
    } else if (onlyTopLevel) {
      filter.$or = [
        { level: 'main' },
        {
          level: { $exists: false },
          $or: [
            { parentId: { $exists: false } },
            { parentId: null },
            { parentId: '' },
          ],
        },
      ];
    }

    return models.Association.find(filter).sort({ createdAt: 1 });
  },

  async mtoAssociation(
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    return models.Association.findOne({ _id });
  },
};

markResolvers(associationQueries, {
  wrapperConfig: {
    skipPermission: true,
  },
});
