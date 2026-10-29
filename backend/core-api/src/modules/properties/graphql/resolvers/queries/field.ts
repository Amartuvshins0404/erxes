import {
  IField,
  IFieldCursorParams,
  IFieldDocument,
  IFieldParams,
} from '@/properties/@types';
import { Resolver } from 'erxes-api-shared/core-types';
import { cursorPaginate } from 'erxes-api-shared/utils';
import { FilterQuery } from 'mongoose';
import { IContext, IModels } from '~/connectionResolvers';
import { reconcileDeclaredFeaturedFields } from '~/modules/properties/utils/featuredFields';

const generateFilter = async (
  models: IModels,
  subdomain: string,
  params: Partial<IFieldParams>,
) => {
  await reconcileDeclaredFeaturedFields(models, subdomain);

  const { contentType, contentTypeId, groupId, archived } = params;

  // Archived fields stay out of every form, table and filter unless asked for.
  const filter: FilterQuery<IField> = {
    contentType,
    archivedAt: { $exists: !!archived },
  };

  if (contentTypeId) {
    filter.contentTypeId = contentTypeId;
  }

  if (groupId) {
    filter.groupId = groupId;
  }

  return filter;
};

export const fieldQueries: Record<string, Resolver<any, any, IContext>> = {
  fields: async (
    _: undefined,
    { params }: { params: IFieldCursorParams },
    { models, subdomain }: IContext,
  ) => {
    const filter = await generateFilter(models, subdomain, params);

    if (!params.orderBy) {
      params.orderBy = { order: 1 };
    }

    return await cursorPaginate<IFieldDocument>({
      model: models.Fields,
      params,
      query: filter,
    });
  },

  // A group stands for all of its fields.
  fieldUsage: async (
    _: undefined,
    {
      fieldIds = [],
      groupId,
      contentType,
    }: { fieldIds?: string[]; groupId?: string; contentType: string },
    { models }: IContext,
  ) => {
    const ids = groupId
      ? (await models.Fields.find({ groupId }, { _id: 1 }).lean()).map(
          (field) => String(field._id),
        )
      : fieldIds;

    return models.Fields.getFieldUsage({ ids, groupId, contentType });
  },

  // Lists record names, so only those who manage fields see it.
  fieldValueUsage: async (
    _: undefined,
    { _id, value }: { _id: string; value?: string },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('fieldsManage');

    return models.Fields.getFieldValueUsage(_id, value ?? undefined);
  },

  fieldValueCounts: async (
    _: undefined,
    { _id, value }: { _id: string; value?: string },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('fieldsManage');

    return models.Fields.getFieldValueCounts(_id, value ?? undefined);
  },

  fieldOptionDependents: async (
    _: undefined,
    { _id, value }: { _id: string; value: string },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('fieldsManage');

    return models.Fields.getOptionDependents(_id, value);
  },

  fieldDetail: async (
    _: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return await models.Fields.getField({ _id });
  },

};
