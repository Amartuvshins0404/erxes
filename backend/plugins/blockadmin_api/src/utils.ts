import { Schema } from 'mongoose';

/**
 * Cursor-paginated response for a filter that cannot match anything, e.g. when
 * the agency or agent an id points at does not exist.
 */
export const EMPTY_CURSOR_LIST = {
  list: [],
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: '',
    endCursor: '',
  },
  totalCount: 0,
};

export const schemaWrapper = (
  schema: Schema,
  options?: { entityIdType?: any },
) => {
  schema.add({
    subdomain: { type: String, required: true, index: true },
    entityId: {
      type: options?.entityIdType || Schema.Types.ObjectId,
      required: true,
      index: true,
    },
  });

  schema.index({ subdomain: 1, entityId: 1 }, { unique: true });

  return schema;
};
