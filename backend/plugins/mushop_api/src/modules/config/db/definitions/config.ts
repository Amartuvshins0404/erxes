import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { IMushopConfigDocument } from '@/config/@types/config';

// Singleton key-value store keyed by `code`. It deliberately does NOT use
// schemaWrapper: that adds a unique (subdomain, entityId) index meant for
// per-entity records, which would collapse every config row into one.
export const mushopConfigSchema = new Schema<IMushopConfigDocument>(
  {
    _id: mongooseStringRandomId,
    // Stable identifier for the setting, e.g. "cnyToMntRate".
    code: { type: String, required: true, unique: true, index: true },
    value: { type: Number },
  },
  {
    timestamps: true,
  },
);
