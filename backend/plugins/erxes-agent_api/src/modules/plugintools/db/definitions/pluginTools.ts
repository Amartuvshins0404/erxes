import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';

// One row per plugin per tenant: models are bound to the tenant connection,
// so the unique index on `plugin` is scoped to the tenant by construction.
export const pluginToolCurationSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    plugin: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    disabledTools: { type: [String], default: [] },
  },
  { timestamps: true },
);
