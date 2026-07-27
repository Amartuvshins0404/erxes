import { Resolver } from 'erxes-api-shared/core-types';
import { markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';

export const categoryQueries: Record<string, Resolver> = {
  async mtoCategories(
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

    return models.Category.find(filter).sort({ createdAt: 1 });
  },

  async mtoCategory(
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    return models.Category.findOne({ _id });
  },
};

markResolvers(categoryQueries, {
  wrapperConfig: {
    skipPermission: true,
  },
});
