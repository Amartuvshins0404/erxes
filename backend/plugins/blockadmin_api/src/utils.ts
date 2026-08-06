import { Schema } from 'mongoose';

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
